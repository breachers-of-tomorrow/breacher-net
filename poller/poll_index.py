"""Poll cryoarchive.systems/indx for entry index changes.

Authenticates via DAC upload + password, then parses the RSC payload
from the authenticated /indx page to extract unlocked entry data.

Uses curl_cffi (TLS fingerprint impersonation) to bypass Vercel Security Checkpoint.
See: https://github.com/breachers-of-tomorrow/breacher-net/issues/49

Auth flow (through curl_cffi session with Chrome TLS fingerprint):
  1. POST /api/session/create -> session cookie
  2. POST /api/auth/login     -> upload DAC PNG (FormData)
  3. POST /api/indx/auth      -> submit index password
  4. GET  /indx               -> parse RSC payload for entry slots
"""

import json
import logging
import os
import re
import sys
from pathlib import Path

from browser import CryoBrowser
from db_writer import get_db, insert_row, record_heartbeat

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("poll_index")

BASE_URL = "https://cryoarchive.systems"

# DAC auth credentials
# DAC_PATH must be provided via CRYO_DAC_PATH env var (mounted secret).
# Each user has their own DAC file tied to their Discord account.
DAC_PATH = os.environ.get("CRYO_DAC_PATH", "")
INDEX_PASSWORD = os.environ.get(
    "CRYO_INDEX_PASSWORD",
    "WITH PAIN AND FURY STRIKE THE STONE UNTIL ITS SECRETS BREAK "
    "WITH SILENT RAGE UPON THESE ALIEN SHORES UNTOLD FUTURES HIDE "
    "GO DEAR VIOLENT ONE TO WHAT ONCE WAS HOME BUT NOW LIES HAUNTED",
)

TOTAL_ENTRIES = 1200


def get_db_conn():
    """Get a database connection (used for index upserts that need ON CONFLICT)."""
    return get_db()


def authenticate(cryo: CryoBrowser) -> bool:
    """Authenticate with cryoarchive via the curl_cffi session.

    The session's Chrome TLS fingerprint bypasses Vercel's WAF automatically.
    Cookies from previous requests in the same session may still be valid,
    so we probe /indx first and skip auth if the session is still good.
    """
    # Try navigating to /indx with existing cookies
    try:
        html, _ = cryo.fetch_page("/indx")
        if "slotId" in html:
            log.info("Existing session still valid, skipping auth")
            return True
    except Exception:
        pass
    log.info("Session expired or missing — performing full auth")

    # Step 1: Create session
    try:
        session_data = cryo.post_json("/api/session/create")
        log.info("Session created: %s", session_data.get("sessionId", "unknown"))
    except Exception:
        log.exception("Failed to create session")
        return False

    # Step 2: Upload DAC
    if not DAC_PATH:
        log.error("CRYO_DAC_PATH not set — cannot authenticate. Mount your DAC file as a secret.")
        return False
    dac_file = Path(DAC_PATH)
    if not dac_file.exists():
        log.error("DAC file not found: %s", DAC_PATH)
        return False

    try:
        dac_data = cryo.post_file(
            "/api/auth/login", "data", str(dac_file), dac_file.name, "image/png",
        )
        log.info("DAC login OK: userId=%s", dac_data.get("data", {}).get("userId", "unknown"))
    except Exception:
        log.exception("Failed DAC login")
        return False

    # Step 3: Authenticate index with password
    try:
        cryo.post_json("/api/indx/auth", {"password": INDEX_PASSWORD})
        log.info("Index authenticated successfully")
        return True
    except Exception:
        log.exception("Failed index auth")
        return False


# RSC payload content extraction helpers
EQ = '\\"'  # literal backslash + double quote as it appears in RSC payloads


def rsc_string_field(chunk: str, field: str) -> str | None:
    """Extract a string field value from raw RSC text."""
    marker = f'{EQ}{field}{EQ}:{EQ}'
    start = chunk.find(marker)
    if start == -1:
        return None
    val_start = start + len(marker)
    val_end = chunk.find(EQ, val_start)
    if val_end == -1:
        return None
    return chunk[val_start:val_end]


def rsc_number_field(chunk: str, field: str) -> int | None:
    """Extract a numeric field value from raw RSC text."""
    marker = f'{EQ}{field}{EQ}:'
    start = chunk.find(marker)
    if start == -1:
        return None
    val_start = start + len(marker)
    m = re.match(r'(\d+|null)', chunk[val_start:val_start + 12])
    if not m or m.group(1) == 'null':
        return None
    return int(m.group(1))


def unescape_rsc(raw: str) -> str:
    """Unescape JS string escapes in RSC text content."""
    return (raw
        .replace('\\n', '\n')
        .replace('\\t', '\t')
        .replace('\\u003e', '>')
        .replace('\\u003c', '<')
        .replace('\\u0026', '&')
        .replace('\\u0027', "'"))


def parse_rsc_entries(html: str) -> list[dict]:
    """Parse unlocked entries from the RSC payload in the authenticated page.

    Extracts content data (CDN URLs, text, YouTube IDs) for each entry.
    """
    scripts = re.findall(r"<script[^>]*>(.*?)</script>", html, re.DOTALL)
    full = "".join(scripts)

    if not full:
        return []

    entries = []
    seen = set()

    for m in re.finditer(
        r"slotId[^0-9]{0,10}?(\d+)[^}]{0,30}?content[^}]{0,30}?type[^a-z]{0,10}?(media|text|youtubeVideo)",
        full,
        re.IGNORECASE,
    ):
        slot_id = m.group(1)
        ctype = m.group(2).lower()

        if slot_id in seen:
            continue
        seen.add(slot_id)

        entry_id = f"ENTRY_{slot_id.zfill(4)}"
        chunk = full[m.start():m.start() + 3000]
        content_data: dict = {}

        if ctype == "media":
            url = rsc_string_field(chunk, "url")
            mime = rsc_string_field(chunk, "mimeType") or ""
            alt = rsc_string_field(chunk, "alt")
            alt_filename = rsc_string_field(chunk, "alt_filename")
            width = rsc_number_field(chunk, "width")
            height = rsc_number_field(chunk, "height")

            if "image" in mime:
                entry_type = "IMAGE"
            elif "audio" in mime:
                entry_type = "AUDIO"
            elif "video" in mime:
                entry_type = "VIDEO"
            elif "pdf" in mime:
                entry_type = "DOCUMENT"
            else:
                entry_type = "MEDIA"

            content_data = {
                "url": url,
                "mimeType": mime or None,
                "alt": alt,
                "altFilename": alt_filename,
                "width": width,
                "height": height,
            }
        elif ctype == "text":
            entry_type = "TEXT"
            raw_text = rsc_string_field(chunk, "text")
            content_data = {"text": unescape_rsc(raw_text) if raw_text else None}
        else:
            # youtubeVideo
            entry_type = "VIDEO"
            content_data = {"youtubeVideoId": rsc_string_field(chunk, "youtubeVideoId")}

        entries.append({
            "entry_id": entry_id,
            "entry_type": entry_type,
            "status": "unlocked",
            "content_data": content_data,
        })

    return entries


def poll_index():
    """Authenticate, fetch the index page, and store entries."""
    with CryoBrowser() as cryo:
        if not authenticate(cryo):
            log.error("Authentication failed")
            return

        try:
            html, _ = cryo.fetch_page("/indx")
        except Exception:
            log.exception("Failed to fetch /indx page")
            return

        unlocked_entries = parse_rsc_entries(html)

    unlocked_ids = {e["entry_id"] for e in unlocked_entries}
    all_entries = list(unlocked_entries)

    # 1-indexed: Entry_1 through Entry_1200
    for i in range(1, TOTAL_ENTRIES + 1):
        entry_id = f"ENTRY_{i:04d}"
        if entry_id not in unlocked_ids:
            all_entries.append({
                "entry_id": entry_id,
                "entry_type": None,
                "status": "locked",
            })

    total = len(all_entries)
    log.info("Parsed %d entries (%d unlocked)", total, len(unlocked_entries))

    try:
        conn = get_db_conn()
        with conn:
            with conn.cursor() as cur:
                for entry in all_entries:
                    cur.execute(
                        """
                        INSERT INTO index_entries (entry_id, entry_type, status, content_data)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (entry_id)
                        DO UPDATE SET
                            entry_type = EXCLUDED.entry_type,
                            status = EXCLUDED.status,
                            content_data = COALESCE(EXCLUDED.content_data, index_entries.content_data),
                            last_updated = NOW()
                        WHERE index_entries.entry_type IS DISTINCT FROM EXCLUDED.entry_type
                           OR index_entries.status IS DISTINCT FROM EXCLUDED.status
                           OR index_entries.content_data IS DISTINCT FROM EXCLUDED.content_data
                        """,
                        (entry["entry_id"], entry["entry_type"], entry["status"],
                         json.dumps(entry["content_data"]) if entry.get("content_data") else None),
                    )

                type_counts = {}
                for e in unlocked_entries:
                    t = e["entry_type"] or "UNKNOWN"
                    type_counts[t] = type_counts.get(t, 0) + 1

                cur.execute(
                    """
                    INSERT INTO index_snapshots (total_entries, unlocked_count, type_counts)
                    VALUES (%s, %s, %s)
                    """,
                    (total, len(unlocked_entries), json.dumps(type_counts)),
                )
        conn.close()
        log.info("Index entries stored successfully")
    except Exception:
        log.exception("Failed to store index entries — buffering snapshot")
        # Buffer the summary snapshot so we don't lose aggregate counts
        from buffer import buffer_row
        type_counts = {}
        for e in unlocked_entries:
            t = e["entry_type"] or "UNKNOWN"
            type_counts[t] = type_counts.get(t, 0) + 1
        buffer_row("index_snapshots", {
            "total_entries": total,
            "unlocked_count": len(unlocked_entries),
            "type_counts": type_counts,
        })


def heartbeat(status="ok"):
    """Record poller heartbeat."""
    record_heartbeat("index_poller", status)


if __name__ == "__main__":
    poll_index()
    heartbeat()
