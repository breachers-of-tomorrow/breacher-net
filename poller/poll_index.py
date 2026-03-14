"""Poll cryoarchive.systems/indx for entry index changes.

Authenticates via DAC upload + password, then parses the RSC payload
from the authenticated /indx page to extract unlocked entry data.

Auth flow:
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

import psycopg2
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("poll_index")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://breacher:breacher@db:5432/breacher")
BASE_URL = "https://cryoarchive.systems"
REQUEST_TIMEOUT = 30

# DAC auth credentials
DAC_PATH = os.environ.get(
    "CRYO_DAC_PATH",
    str(Path(__file__).parent / "dac" / "71cc79cd-25f6-4884-8e26-4cfdddc81864.png"),
)
INDEX_PASSWORD = os.environ.get(
    "CRYO_INDEX_PASSWORD",
    "WITH PAIN AND FURY STRIKE THE STONE UNTIL ITS SECRETS BREAK "
    "WITH SILENT RAGE UPON THESE ALIEN SHORES UNTOLD FUTURES HIDE "
    "GO DEAR VIOLENT ONE TO WHAT ONCE WAS HOME BUT NOW LIES HAUNTED",
)

TOTAL_ENTRIES = 1200


def get_db():
    """Get a database connection."""
    return psycopg2.connect(DATABASE_URL)


def authenticate(session: requests.Session) -> bool:
    """Authenticate with cryoarchive: session -> DAC -> password.

    Checks if the session already has valid credentials before
    performing the full auth flow (avoids failing on duplicate login).
    """
    # Try fetching /indx directly — if the session is still valid, skip auth
    try:
        probe = session.get(
            f"{BASE_URL}/indx",
            timeout=REQUEST_TIMEOUT,
            allow_redirects=False,
        )
        if probe.status_code == 200 and "slotId" in probe.text:
            log.info("Existing session still valid, skipping auth")
            return True
    except Exception:
        pass  # No existing session, proceed with full auth

    # Step 1: Create session
    try:
        resp = session.post(f"{BASE_URL}/api/session/create", timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        log.info("Session created: %s", resp.json().get("sessionId", "unknown"))
    except Exception:
        log.exception("Failed to create session")
        return False

    # Step 2: Upload DAC
    dac_file = Path(DAC_PATH)
    if not dac_file.exists():
        log.error("DAC file not found: %s", DAC_PATH)
        return False

    try:
        with open(dac_file, "rb") as f:
            resp = session.post(
                f"{BASE_URL}/api/auth/login",
                files={"data": (dac_file.name, f, "image/png")},
                timeout=REQUEST_TIMEOUT,
            )
        if not resp.ok:
            log.error("DAC login failed: %s %s", resp.status_code, resp.text[:200])
            return False
        data = resp.json()
        log.info("DAC login OK: userId=%s", data.get("data", {}).get("userId", "unknown"))
    except Exception:
        log.exception("Failed DAC login")
        return False

    # Step 3: Authenticate index with password
    try:
        resp = session.post(
            f"{BASE_URL}/api/indx/auth",
            json={"password": INDEX_PASSWORD},
            timeout=REQUEST_TIMEOUT,
        )
        if not resp.ok:
            log.error("Index auth failed: %s %s", resp.status_code, resp.text[:200])
            return False
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
    session = requests.Session()
    session.headers.update({"User-Agent": "BREACHER//NET Index Poller"})

    if not authenticate(session):
        log.error("Authentication failed")
        return

    try:
        resp = session.get(f"{BASE_URL}/indx", timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
    except Exception:
        log.exception("Failed to fetch /indx page")
        return

    unlocked_entries = parse_rsc_entries(resp.text)

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
        conn = get_db()
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
        log.exception("Failed to store index entries")


def heartbeat(status="ok"):
    """Record poller heartbeat."""
    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO poller_heartbeats (poller_name, status)
                    VALUES ('index_poller', %s)
                    """,
                    (status,),
                )
        conn.close()
    except Exception:
        log.exception("Failed to record heartbeat")


if __name__ == "__main__":
    poll_index()
    heartbeat()
