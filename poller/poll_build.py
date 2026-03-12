"""Poll cryoarchive.systems for build/deployment changes, store detected changes in PostgreSQL."""

import hashlib
import json
import logging
import os
import sys
from datetime import datetime, timezone

import psycopg2
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("poll_build")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://breacher:breacher@db:5432/breacher")
TARGET_URL = "https://cryoarchive.systems"
REQUEST_TIMEOUT = 15


def get_db():
    """Get a database connection."""
    return psycopg2.connect(DATABASE_URL)


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


def compute_build_hash(headers: dict, body_snippet: str) -> str:
    """Compute a hash representing the current build state."""
    # Use a combination of key headers and body content
    fingerprint_parts = []

    for header in ["etag", "last-modified", "x-build-id", "x-version"]:
        val = headers.get(header, "")
        if val:
            fingerprint_parts.append(f"{header}:{val}")

    # Hash first 2KB of body for content change detection
    body_hash = hashlib.sha256(body_snippet[:2048].encode()).hexdigest()[:16]
    fingerprint_parts.append(f"body:{body_hash}")

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
        resp = requests.get(TARGET_URL, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
    except Exception:
        log.exception("Failed to fetch target site")
        return

    headers = {k.lower(): v for k, v in resp.headers.items()}
    body_snippet = resp.text[:4096]

    current_hash = compute_build_hash(headers, body_snippet)
    last_hash = get_last_build_hash()

    if current_hash == last_hash:
        log.debug("No build change detected (hash=%s)", current_hash[:12])
        return

    # New build detected
    interesting_headers = extract_headers_of_interest(headers)

    details = {
        "status_code": resp.status_code,
        "content_length": len(resp.text),
        "previous_hash": last_hash,
    }

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO build_events
                        (build_hash, summary, details, headers)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (build_hash) WHERE build_hash IS NOT NULL
                    DO NOTHING
                    """,
                    (
                        current_hash,
                        f"Build change detected (hash: {current_hash[:12]})",
                        json.dumps(details),
                        json.dumps(interesting_headers),
                    ),
                )
        conn.close()
        log.info("BUILD CHANGE DETECTED — hash=%s (previous=%s)", current_hash[:12], last_hash[:12] if last_hash else "none")
    except Exception:
        log.exception("Failed to save build event")


def heartbeat(status="ok"):
    """Record poller heartbeat."""
    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO poller_heartbeats (poller_name, status)
                    VALUES ('build_poller', %s)
                    """,
                    (status,),
                )
        conn.close()
    except Exception:
        log.exception("Failed to record heartbeat")


if __name__ == "__main__":
    poll_build()
    heartbeat()
