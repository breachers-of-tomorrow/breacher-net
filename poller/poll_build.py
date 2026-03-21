"""Poll cryoarchive.systems for build/deployment changes, store detected changes in PostgreSQL.

Uses curl_cffi (TLS fingerprint impersonation) to bypass Vercel Security Checkpoint.
See: https://github.com/breachers-of-tomorrow/breacher-net/issues/49

Fingerprinting strategy:
- Extract the Vercel deployment ID from Next.js chunk URLs (dpl=dpl_XXXX)
- Track static asset fingerprints (hashed filenames in chunk URLs)
- These only change when an actual deployment occurs, avoiding false
  positives from dynamic page content (kill counts, timestamps, etc.)
"""

import hashlib
import json
import logging
import os
import re
import sys

from browser import CryoBrowser
from db_writer import get_db, insert_row, record_heartbeat

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("poll_build")

# Regex patterns for deployment fingerprinting
DPL_PATTERN = re.compile(r"dpl=(dpl_[a-zA-Z0-9]+)")
CHUNK_PATTERN = re.compile(r'/_next/static/chunks/([a-f0-9]{12,}\.js)')
CSS_PATTERN = re.compile(r'/_next/static/chunks/([a-f0-9]{12,}\.css)')
BUILD_ID_PATTERN = re.compile(r'/_next/static/([a-zA-Z0-9_-]{20,})/')


def get_last_build_hash() -> str | None:
    """Retrieve the most recent build hash from the database."""
    try:
        conn = get_db()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT build_hash FROM build_events ORDER BY detected_at DESC LIMIT 1"
            )
            row = cur.fetchone()
        conn.close()
        return row[0] if row else None
    except Exception:
        log.exception("Failed to get last build hash")
        return None


def extract_deployment_id(html: str) -> str | None:
    """Extract Vercel deployment ID from chunk URL params (dpl=dpl_XXXX)."""
    match = DPL_PATTERN.search(html)
    return match.group(1) if match else None


def extract_static_assets(html: str) -> list[str]:
    """Extract hashed static asset filenames from chunk/CSS URLs."""
    chunks = sorted(set(CHUNK_PATTERN.findall(html)))
    css = sorted(set(CSS_PATTERN.findall(html)))
    return chunks + css


def extract_build_id(html: str) -> str | None:
    """Extract Next.js build ID from static asset paths."""
    match = BUILD_ID_PATTERN.search(html)
    return match.group(1) if match else None


def compute_build_hash(html: str) -> str:
    """Compute a hash based on deployment-stable signals only.

    Uses deployment ID, build ID, and static asset fingerprints — none of
    which change unless an actual deployment occurs.
    """
    fingerprint_parts = []

    # Primary signal: Vercel deployment ID
    dpl_id = extract_deployment_id(html)
    if dpl_id:
        fingerprint_parts.append(f"dpl:{dpl_id}")

    # Secondary signal: Next.js build ID
    build_id = extract_build_id(html)
    if build_id:
        fingerprint_parts.append(f"build:{build_id}")

    # Tertiary signal: static asset fingerprints
    assets = extract_static_assets(html)
    if assets:
        asset_hash = hashlib.sha256("|".join(assets).encode()).hexdigest()[:16]
        fingerprint_parts.append(f"assets:{asset_hash}")

    # Fallback: if no deployment signals found, the site structure changed fundamentally
    if not fingerprint_parts:
        log.warning("No deployment signals found — falling back to full page hash")
        page_hash = hashlib.sha256(html.encode()).hexdigest()[:16]
        fingerprint_parts.append(f"fallback:{page_hash}")

    combined = "|".join(fingerprint_parts)
    return hashlib.sha256(combined.encode()).hexdigest()[:32]


def extract_headers_of_interest(headers: dict) -> dict:
    """Extract headers that might indicate build/deploy info."""
    keys = [
        "etag", "last-modified", "x-build-id", "x-version",
        "server", "x-powered-by", "cf-ray", "x-request-id",
        "content-length", "date",
    ]
    return {k: headers.get(k) for k in keys if headers.get(k)}


def poll_build():
    """Check for build changes on cryoarchive.systems."""
    try:
        with CryoBrowser() as cryo:
            html, resp_headers = cryo.fetch_page("/")
    except Exception:
        log.exception("Failed to fetch target site")
        return

    headers = {k.lower(): v for k, v in resp_headers.items()}

    current_hash = compute_build_hash(html)
    last_hash = get_last_build_hash()

    if current_hash == last_hash:
        log.debug("No build change detected (hash=%s)", current_hash[:12])
        return

    # New build detected — gather details
    interesting_headers = extract_headers_of_interest(headers)
    dpl_id = extract_deployment_id(html)
    build_id = extract_build_id(html)
    assets = extract_static_assets(html)

    details = {
        "content_length": len(html),
        "previous_hash": last_hash,
        "deployment_id": dpl_id,
        "build_id": build_id,
        "asset_count": len(assets),
    }

    summary_parts = []
    if dpl_id:
        summary_parts.append(f"deployment {dpl_id}")
    if build_id:
        summary_parts.append(f"build {build_id[:12]}")
    summary = f"Build change detected: {', '.join(summary_parts) or current_hash[:12]}"

    written = insert_row(
        table="build_events",
        columns=["build_hash", "summary", "details", "headers"],
        values=[
            current_hash,
            summary,
            json.dumps(details),
            json.dumps(interesting_headers),
        ],
        params_dict={
            "build_hash": current_hash,
            "summary": summary,
            "details": details,
            "headers": interesting_headers,
        },
        on_conflict="ON CONFLICT (build_hash) WHERE build_hash IS NOT NULL DO NOTHING",
    )
    if written:
        log.info("BUILD CHANGE DETECTED — hash=%s dpl=%s (previous=%s)",
                 current_hash[:12], dpl_id or "unknown",
                 last_hash[:12] if last_hash else "none")
    else:
        log.warning("BUILD CHANGE DETECTED but DB unavailable — buffered (hash=%s)",
                    current_hash[:12])


def heartbeat(status="ok"):
    """Record poller heartbeat."""
    record_heartbeat("build_poller", status)


if __name__ == "__main__":
    poll_build()
    heartbeat()
