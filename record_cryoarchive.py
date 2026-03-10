import requests
import csv
import os
import time
import subprocess
from datetime import datetime, timezone, timedelta

# --- Configuration ---
STABILIZATION_URL = "https://cryoarchive.systems/api/public/cctv-cameras/stabilization"
STATE_URL = "https://cryoarchive.systems/api/public/state"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STABILIZATION_FILE = os.path.join(BASE_DIR, "stabilization_log.csv")
STATE_FILE = os.path.join(BASE_DIR, "state_log.csv")

CAMERAS = ["cargo", "index", "revival", "biostock", "steerage", "preservation", "cryoHub", "camera06", "camera09"]
PAGES = ["cargo", "index", "revival", "biostock", "steerage", "preservation", "cryoHub"]

FALLBACK_INTERVAL = 15 * 60  # 15 minutes fallback
POLL_INTERVAL = 15          # seconds between polls during the update window
POLL_WINDOW_EARLY = 2 * 60  # start polling this many seconds BEFORE expected update
POLL_WINDOW_LATE = 5 * 60   # give up polling after this many seconds PAST expected update


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


def git_push():
    """Commit and push updated CSVs to GitHub."""
    try:
        subprocess.run(["git", "add", "stabilization_log.csv", "state_log.csv"], cwd=BASE_DIR, check=True)
        result = subprocess.run(
            ["git", "commit", "-m", f"Data update {get_timestamp()}"],
            cwd=BASE_DIR, capture_output=True, text=True
        )
        if "nothing to commit" in result.stdout:
            print("  No changes to push.")
            return

        # Pull remote changes before pushing (rebase keeps CSV append history linear).
        pull_result = subprocess.run(
            ["git", "pull", "--rebase", "--autostash"],
            cwd=BASE_DIR, capture_output=True, text=True
        )
        if pull_result.returncode != 0:
            print(f"[WARN] Git pull --rebase failed:\n{pull_result.stderr.strip()}")
            return

        subprocess.run(["git", "push"], cwd=BASE_DIR, check=True)
        print("  GitHub updated successfully.")
    except subprocess.CalledProcessError as e:
        print(f"[WARN] Git push failed: {e}")


def get_known_next_times(stab_data):
    """Return a set of all non-null nextStabilizationAt strings across all cameras."""
    return {
        cam.get("nextStabilizationAt")
        for cam in stab_data.values()
        if cam.get("nextStabilizationAt") is not None
    }


def get_next_stabilization_dt(stab_data):
    """Return the soonest nextStabilizationAt as a datetime, or None if all null."""
    times = []
    for cam in stab_data.values():
        raw = cam.get("nextStabilizationAt")
        if raw:
            try:
                times.append(datetime.fromisoformat(raw.replace("Z", "+00:00")))
            except Exception:
                pass
    return min(times) if times else None


def wait_until(target_dt, label=""):
    """Sleep until target_dt, printing a status line."""
    now = datetime.now(timezone.utc)
    wait_secs = (target_dt - now).total_seconds()
    if wait_secs > 0:
        print(f"  Sleeping until {target_dt.strftime('%Y-%m-%d %H:%M:%S UTC')}"
              f" ({int(wait_secs)}s){' — ' + label if label else ''}")
        time.sleep(wait_secs)


def run():
    print("=" * 40)
    print("  CRYOARCHIVE DATA LOGGER")
    print("=" * 40)
    print("  Syncing to stabilization schedule.")
    print("  Press Ctrl+C to stop.")
    print("=" * 40)

    # Bootstrap: fetch initial data to learn the current nextStabilizationAt values.
    stab_data = None
    while stab_data is None:
        try:
            stab_data = fetch(STABILIZATION_URL)["stabilization"]
        except Exception as e:
            print(f"[ERROR] Bootstrap fetch failed: {e}. Retrying in 30s...")
            time.sleep(30)

    known_next_times = get_known_next_times(stab_data)
    print(f"  Known nextStabilizationAt values: {known_next_times or 'none (all null)'}")

    while True:
        # --- Determine when to start polling ---
        next_dt = get_next_stabilization_dt(stab_data)

        if next_dt is None:
            # All cameras are fully stabilized; fall back to checking every 15 min.
            print(f"  All cameras show null nextStabilizationAt. "
                  f"Falling back to {FALLBACK_INTERVAL // 60}-min interval.")
            time.sleep(FALLBACK_INTERVAL)
            try:
                stab_data = fetch(STABILIZATION_URL)["stabilization"]
                known_next_times = get_known_next_times(stab_data)
            except Exception as e:
                print(f"[ERROR] Stabilization: {e}")
            continue

        # Sleep until POLL_WINDOW_EARLY seconds before the expected flip.
        poll_start_dt = next_dt - timedelta(seconds=POLL_WINDOW_EARLY)
        poll_deadline_dt = next_dt + timedelta(seconds=POLL_WINDOW_LATE)

        now = datetime.now(timezone.utc)
        if poll_start_dt > now:
            wait_until(poll_start_dt, label="pre-poll wait")

        # --- Active polling window ---
        print(f"  Entering poll window. Watching for nextStabilizationAt to change...")
        recorded = False

        while datetime.now(timezone.utc) < poll_deadline_dt:
            try:
                fresh = fetch(STABILIZATION_URL)["stabilization"]
            except Exception as e:
                print(f"[ERROR] Poll fetch failed: {e}")
                time.sleep(POLL_INTERVAL)
                continue

            fresh_times = get_known_next_times(fresh)

            # A change is detected when ANY camera now shows a time we haven't seen before.
            new_times = fresh_times - known_next_times
            if new_times:
                timestamp = get_timestamp()
                print(f"[{timestamp}] Change detected — new nextStabilizationAt: {new_times}")

                # Record stabilization snapshot.
                log_stabilization(fresh)

                # Record state snapshot.
                try:
                    state_data = fetch(STATE_URL)["state"]
                    log_state(state_data)
                except Exception as e:
                    print(f"[ERROR] State: {e}")

                git_push()

                # Advance our baseline to the new values.
                stab_data = fresh
                known_next_times = fresh_times
                recorded = True
                break  # Done for this interval; exit the poll loop.

            time.sleep(POLL_INTERVAL)

        if not recorded:
            print(f"  [WARN] Poll window closed without detecting a change. "
                  f"Will retry at next interval.")
            # Refresh stab_data so we have current values for next cycle.
            try:
                stab_data = fetch(STABILIZATION_URL)["stabilization"]
                known_next_times = get_known_next_times(stab_data)
            except Exception as e:
                print(f"[ERROR] Refresh failed: {e}")


def self_test():
    """
    Startup check: fetch live data, write one row to each CSV,
    then read it back to confirm the files are updating correctly.
    Returns True if all checks pass, False otherwise.
    """
    print("=" * 40)
    print("  STARTUP SELF-TEST")
    print("=" * 40)
    passed = True

    # --- 1. API reachability ---
    print("  [1/3] Checking API endpoints...")
    stab_data = None
    state_data = None
    try:
        stab_data = fetch(STABILIZATION_URL)["stabilization"]
        print(f"        stabilization API  OK  ({len(stab_data)} cameras)")
    except Exception as e:
        print(f"        stabilization API  FAIL  {e}")
        passed = False

    try:
        state_data = fetch(STATE_URL)["state"]
        print(f"        state API          OK  (shipDate: {state_data.get('shipDate', 'N/A')})")
    except Exception as e:
        print(f"        state API          FAIL  {e}")
        passed = False

    if not passed:
        print("  [ABORT] API check failed — cannot continue.\n")
        return False

    # --- 2. CSV write ---
    print("  [2/3] Writing test rows to CSVs...")
    stab_before = _count_csv_rows(STABILIZATION_FILE)
    state_before = _count_csv_rows(STATE_FILE)

    try:
        log_stabilization(stab_data)
        log_state(state_data)
    except Exception as e:
        print(f"        FAIL  {e}")
        return False

    # --- 3. CSV read-back verification ---
    print("  [3/3] Verifying rows were written...")
    stab_after = _count_csv_rows(STABILIZATION_FILE)
    state_after = _count_csv_rows(STATE_FILE)

    stab_ok = stab_after == stab_before + 1
    state_ok = state_after == state_before + 1

    print(f"        stabilization_log.csv  {'OK' if stab_ok else 'FAIL'}  "
          f"({stab_before} → {stab_after} rows)")
    print(f"        state_log.csv          {'OK' if state_ok else 'FAIL'}  "
          f"({state_before} → {state_after} rows)")

    if not (stab_ok and state_ok):
        print("  [ABORT] CSV write check failed.\n")
        return False

    print("  All checks passed. Starting logger...\n")
    return True


def _count_csv_rows(filepath):
    """Return number of data rows in a CSV (excludes header), or 0 if file doesn't exist."""
    if not os.path.isfile(filepath):
        return 0
    with open(filepath, newline="") as f:
        # subtract 1 for header row; max 0 in case file is empty
        return max(0, sum(1 for _ in f) - 1)


if __name__ == "__main__":
    try:
        if self_test():
            run()
        else:
            print("[STOPPED] Self-test failed. Fix the issues above and retry.")
    except KeyboardInterrupt:
        print("\n[STOPPED] Logger shut down.")
