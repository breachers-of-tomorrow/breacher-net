import requests
import csv
import os
import time
from datetime import datetime, timezone

# --- Configuration ---
STABILIZATION_URL = "https://cryoarchive.systems/api/public/cctv-cameras/stabilization"
STATE_URL = "https://cryoarchive.systems/api/public/state"

# Save CSVs in the same folder as this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STABILIZATION_FILE = os.path.join(BASE_DIR, "stabilization_log.csv")
STATE_FILE = os.path.join(BASE_DIR, "state_log.csv")

CAMERAS = ["cargo", "index", "revival", "biostock", "steerage", "preservation", "cryoHub", "camera06", "camera09"]
PAGES = ["cargo", "index", "revival", "biostock", "steerage", "preservation", "cryoHub"]

FALLBACK_INTERVAL = 15 * 60  # 15 minutes fallback if API doesn't return a next time


def get_timestamp():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def fetch(url):
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    return response.json()


def log_stabilization(data):
    timestamp = get_timestamp()
    file_exists = os.path.isfile(STABILIZATION_FILE)

    with open(STABILIZATION_FILE, mode="a", newline="") as file:
        writer = csv.writer(file)
        if not file_exists:
            header = ["timestamp"]
            for cam in CAMERAS:
                header.append(f"{cam}_stabilizationLevel")
                header.append(f"{cam}_nextStabilizationAt")
            writer.writerow(header)

        row = [timestamp]
        for cam in CAMERAS:
            cam_data = data.get(cam, {})
            row.append(cam_data.get("stabilizationLevel", "N/A"))
            row.append(cam_data.get("nextStabilizationAt", "N/A"))
        writer.writerow(row)

    print(f"[{timestamp}] Stabilization data recorded.")


def log_state(data):
    timestamp = get_timestamp()
    file_exists = os.path.isfile(STATE_FILE)

    with open(STATE_FILE, mode="a", newline="") as file:
        writer = csv.writer(file)
        if not file_exists:
            header = ["timestamp", "shipDate", "memoryUnlocked", "memoryCompleted",
                      "uescKillCount", "uescKillCountNextUpdateAt"]
            for page in PAGES:
                header.append(f"{page}_unlocked")
                header.append(f"{page}_completed")
            writer.writerow(header)

        pages = data.get("pages", {})
        row = [
            timestamp,
            data.get("shipDate", "N/A"),
            data.get("memoryUnlocked", "N/A"),
            data.get("memoryCompleted", "N/A"),
            data.get("uescKillCount", "N/A"),
            data.get("uescKillCountNextUpdateAt", "N/A"),
        ]
        for page in PAGES:
            page_data = pages.get(page, {})
            row.append(page_data.get("unlocked", "N/A"))
            row.append(page_data.get("completed", "N/A"))
        writer.writerow(row)

    print(f"[{timestamp}] State data recorded.")


def get_next_update_time(stab_data):
    """Read nextStabilizationAt from the first camera and return seconds until then."""
    try:
        first_cam = next(iter(stab_data.values()))
        next_time_str = first_cam.get("nextStabilizationAt")
        if not next_time_str:
            return FALLBACK_INTERVAL

        next_time = datetime.fromisoformat(next_time_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        seconds_until = (next_time - now).total_seconds()

        # Wait 2 minutes after nextStabilizationAt to make sure the API has updated
        seconds_until += 120

        if seconds_until < 10:
            return FALLBACK_INTERVAL

        return seconds_until
    except Exception as e:
        print(f"[WARN] Could not parse next update time: {e}")
        return FALLBACK_INTERVAL


def run():
    print("=" * 40)
    print("  CRYOARCHIVE DATA LOGGER")
    print("=" * 40)
    print("  Syncing to stabilization schedule.")
    print("  Press Ctrl+C to stop.")
    print("=" * 40)

    while True:
        stab_data = None

        try:
            stab_data = fetch(STABILIZATION_URL)["stabilization"]
            log_stabilization(stab_data)
        except Exception as e:
            print(f"[ERROR] Stabilization: {e}")

        try:
            state_data = fetch(STATE_URL)["state"]
            log_state(state_data)
        except Exception as e:
            print(f"[ERROR] State: {e}")

        wait = get_next_update_time(stab_data) if stab_data else FALLBACK_INTERVAL
        next_run = datetime.fromtimestamp(
            datetime.now(timezone.utc).timestamp() + wait, tz=timezone.utc
        )
        print(f"  Next check at: {next_run.strftime('%Y-%m-%d %H:%M:%S UTC')} ({int(wait)}s)\n")
        time.sleep(wait)


if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        print("\n[STOPPED] Logger shut down.")
