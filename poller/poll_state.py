"""Poll cryoarchive.systems state and stabilization APIs, store snapshots in PostgreSQL."""

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
log = logging.getLogger("poll_state")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://breacher:breacher@db:5432/breacher")
STATE_API = "https://cryoarchive.systems/api/public/state"
STABILIZATION_API = "https://cryoarchive.systems/api/public/cctv-cameras/stabilization"
REQUEST_TIMEOUT = 15


def get_db():
    """Get a database connection."""
    return psycopg2.connect(DATABASE_URL)


def poll_state():
    """Fetch state API and store a snapshot."""
    try:
        resp = requests.get(STATE_API, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        log.exception("Failed to fetch state API")
        return

    state = data.get("state", {})
    sectors = state.get("sectors", {})
    kill_count = state.get("killCount")
    ship_date = state.get("shipDate")
    next_update = state.get("nextUpdate")
    build_version = state.get("version")
    memory_flags = state.get("memoryFlags", {})

    try:
        conn = get_db()
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO state_snapshots
                        (kill_count, ship_date, next_update, build_version, sectors, memory_flags, raw_response)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        kill_count,
                        ship_date,
                        next_update,
                        build_version,
                        json.dumps(sectors),
                        json.dumps(memory_flags),
                        json.dumps(data),
                    ),
                )
        conn.close()
        log.info("State snapshot saved (kill_count=%s)", kill_count)
    except Exception:
        log.exception("Failed to save state snapshot")


def poll_stabilization():
    """Fetch stabilization API and store a snapshot."""
    try:
        resp = requests.get(STABILIZATION_API, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        log.exception("Failed to fetch stabilization API")
        return

    cameras = data.get("cameras", {})
    next_stab = data.get("nextStabilization")

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
    poll_state()
    poll_stabilization()
    heartbeat()
    log.info("Poll cycle complete")
