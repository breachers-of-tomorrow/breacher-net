"""Poll cryoarchive.systems state and stabilization APIs, store snapshots in PostgreSQL.

Uses curl_cffi (TLS fingerprint impersonation) to bypass Vercel Security Checkpoint.
See: https://github.com/breachers-of-tomorrow/breacher-net/issues/49
"""

import json
import logging
import os
import sys

import psycopg2

from browser import CryoBrowser

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("poll_state")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://breacher:breacher@db:5432/breacher")


def get_db():
    """Get a database connection."""
    return psycopg2.connect(DATABASE_URL)


def poll_state(cryo: CryoBrowser):
    """Fetch state API and store a snapshot."""
    try:
        data = cryo.fetch_json("/api/public/state")
    except Exception:
        log.exception("Failed to fetch state API")
        return

    state = data.get("state", {})
    pages = state.get("pages", {})
    kill_count = state.get("uescKillCount")
    ship_date = state.get("shipDate")
    next_update = state.get("uescKillCountNextUpdateAt")
    memory_flags = {
        "memoryUnlocked": state.get("memoryUnlocked", False),
        "memoryCompleted": state.get("memoryCompleted", False),
    }
    # Flatten pages into sector states for storage
    sectors = {name: info for name, info in pages.items()}

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO state_snapshots
                        (kill_count, ship_date, next_update, sectors, memory_flags, raw_response)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        kill_count,
                        ship_date,
                        next_update,
                        json.dumps(sectors),
                        json.dumps(memory_flags),
                        json.dumps(data),
                    ),
                )
        conn.close()
        log.info("State snapshot saved (kill_count=%s)", kill_count)
    except Exception:
        log.exception("Failed to save state snapshot")


def poll_stabilization(cryo: CryoBrowser):
    """Fetch stabilization API and store a snapshot."""
    try:
        data = cryo.fetch_json("/api/public/cctv-cameras/stabilization")
    except Exception:
        log.exception("Failed to fetch stabilization API")
        return

    cameras = data.get("stabilization", {})
    # Find the earliest next stabilization time across all cameras
    next_stab_times = [
        cam.get("nextStabilizationAt")
        for cam in cameras.values()
        if isinstance(cam, dict) and cam.get("nextStabilizationAt")
    ]
    next_stab = min(next_stab_times) if next_stab_times else None

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO stabilization_snapshots
                        (cameras, next_stabilization, raw_response)
                    VALUES (%s, %s, %s)
                    """,
                    (
                        json.dumps(cameras),
                        next_stab,
                        json.dumps(data),
                    ),
                )
        conn.close()
        log.info("Stabilization snapshot saved (%d cameras)", len(cameras))
    except Exception:
        log.exception("Failed to save stabilization snapshot")


def heartbeat(status="ok", details=None):
    """Record poller heartbeat."""
    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO poller_heartbeats (poller_name, status, details)
                    VALUES ('state_poller', %s, %s)
                    """,
                    (status, json.dumps(details) if details else None),
                )
        conn.close()
    except Exception:
        log.exception("Failed to record heartbeat")


if __name__ == "__main__":
    log.info("Starting state poll cycle")
    try:
        with CryoBrowser() as cryo:
            poll_state(cryo)
            poll_stabilization(cryo)
        heartbeat()
    except Exception:
        log.exception("State poll cycle failed")
        heartbeat(status="error", details={"error": "browser_or_challenge_failure"})
    log.info("Poll cycle complete")
