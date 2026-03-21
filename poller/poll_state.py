"""Poll cryoarchive.systems state and stabilization APIs, store snapshots in PostgreSQL.

Uses curl_cffi (TLS fingerprint impersonation) to bypass Vercel Security Checkpoint.
See: https://github.com/breachers-of-tomorrow/breacher-net/issues/49
"""

import json
import logging
import os
import sys

import requests

from browser import CryoBrowser
from db_writer import insert_row, record_heartbeat

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("poll_state")

MARATHON_STEAM_APP_ID = 3065800
STEAM_API_URL = (
    f"https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/"
    f"?appid={MARATHON_STEAM_APP_ID}"
)


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

    written = insert_row(
        table="state_snapshots",
        columns=["kill_count", "ship_date", "next_update", "sectors", "memory_flags", "raw_response"],
        values=[
            kill_count,
            ship_date,
            next_update,
            json.dumps(sectors),
            json.dumps(memory_flags),
            json.dumps(data),
        ],
        params_dict={
            "kill_count": kill_count,
            "ship_date": ship_date,
            "next_update": next_update,
            "sectors": sectors,
            "memory_flags": memory_flags,
            "raw_response": data,
        },
    )
    if written:
        log.info("State snapshot saved (kill_count=%s)", kill_count)
    else:
        log.warning("State snapshot buffered locally (kill_count=%s)", kill_count)


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

    written = insert_row(
        table="stabilization_snapshots",
        columns=["cameras", "next_stabilization", "raw_response"],
        values=[
            json.dumps(cameras),
            next_stab,
            json.dumps(data),
        ],
        params_dict={
            "cameras": cameras,
            "next_stabilization": next_stab,
            "raw_response": data,
        },
    )
    if written:
        log.info("Stabilization snapshot saved (%d cameras)", len(cameras))
    else:
        log.warning("Stabilization snapshot buffered locally (%d cameras)", len(cameras))


def heartbeat(status="ok", details=None):
    """Record poller heartbeat."""
    record_heartbeat("state_poller", status, details)


def poll_steam():
    """Fetch current Steam player count and store a snapshot.

    Uses the public ISteamUserStats endpoint — no API key required.
    This is a lightweight HTTP call that doesn't need the CryoBrowser.
    """
    try:
        resp = requests.get(
            STEAM_API_URL,
            timeout=10,
            headers={"User-Agent": "breacher-net-poller/1.0 (+https://breacher.net)"},
        )
        resp.raise_for_status()
        data = resp.json()

        if data.get("response", {}).get("result") != 1:
            log.warning("Steam API returned unexpected result: %s", data)
            return

        player_count = data["response"]["player_count"]
    except Exception:
        log.exception("Failed to fetch Steam player count")
        return

    written = insert_row(
        table="steam_snapshots",
        columns=["player_count", "app_id"],
        values=[player_count, MARATHON_STEAM_APP_ID],
        params_dict={
            "player_count": player_count,
            "app_id": MARATHON_STEAM_APP_ID,
        },
    )
    if written:
        log.info("Steam snapshot saved (player_count=%s)", player_count)
    else:
        log.warning("Steam snapshot buffered locally (player_count=%s)", player_count)


if __name__ == "__main__":
    log.info("Starting state poll cycle")
    try:
        with CryoBrowser() as cryo:
            poll_state(cryo)
            poll_stabilization(cryo)
        # Steam API is a plain HTTP call — runs outside the browser session
        poll_steam()
        heartbeat()
    except Exception:
        log.exception("State poll cycle failed")
        heartbeat(status="error", details={"error": "browser_or_challenge_failure"})
    log.info("Poll cycle complete")
