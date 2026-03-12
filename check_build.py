#!/usr/bin/env python3
"""
Cryoarchive Monitor for cryoarchive.systems

Combines two functions that run every 5 minutes via GitHub Actions:
  1. Build Tracker — detects Vercel deployment changes (deployment ID, chunks)
  2. Data Recorder — snapshots the public state and stabilization APIs to CSV

Build changes are recorded to build_state.json / build_log.json.
API data is appended to state_log.csv / stabilization_log.csv every ~15 min
(matching the site's API refresh cadence) or immediately on value change.
"""

import csv
import hashlib
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SITE_URL = "https://cryoarchive.systems"
STABILIZATION_URL = "https://cryoarchive.systems/api/public/cctv-cameras/stabilization"
STATE_API_URL = "https://cryoarchive.systems/api/public/state"

# Build tracker files
BUILD_STATE_FILE = os.path.join(BASE_DIR, "build_state.json")
BUILD_LOG_FILE = os.path.join(BASE_DIR, "build_log.json")

# API data CSV files (append-only history)
STABILIZATION_CSV = os.path.join(BASE_DIR, "stabilization_log.csv")
STATE_CSV = os.path.join(BASE_DIR, "state_log.csv")

# Lightweight JSON snapshot for client-side countdown bars
LATEST_STATE_FILE = os.path.join(BASE_DIR, "latest_state.json")

CAMERAS = ["cargo", "index", "revival", "biostock", "steerage", "preservation", "cryoHub", "camera06", "camera09"]
PAGES = ["cargo", "index", "revival", "biostock", "steerage", "preservation", "cryoHub"]

# Only record API data when >=14 min have passed OR a value changed
RECORD_INTERVAL_SECS = 14 * 60


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def fetch(url: str, timeout: int = 20) -> tuple[int, dict[str, str], str]:
    """Fetch URL and return (status, headers_dict, body)."""
    req = Request(url, headers={"User-Agent": "Marathon-ARG-BuildTracker/1.0"})
    try:
        with urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            headers = {k.lower(): v for k, v in resp.getheaders()}
            return resp.status, headers, body
    except HTTPError as exc:
        return exc.code, {}, ""
    except URLError as exc:
        print(f"[ERROR] Could not reach {url}: {exc}")
        sys.exit(1)


def extract_deployment_id(html: str) -> str | None:
    """Pull the Vercel deployment ID from dpl= query params in chunk URLs."""
    match = re.search(r"dpl=(dpl_[a-zA-Z0-9]+)", html)
    return match.group(1) if match else None


def extract_chunks(html: str) -> list[str]:
    """Extract all unique Next.js chunk filenames from <script>/<link> tags."""
    # Hex-hash chunks: HASH.js or HASH.css (16+ hex chars)
    hex_chunks = re.findall(r"/_next/static/chunks/([a-f0-9]{16,}\.[a-z]{2,4})", html)
    # Turbopack/webpack named chunks: word-HASH.ext
    named_chunks = re.findall(r"/_next/static/chunks/([a-zA-Z][a-zA-Z0-9_-]*-[a-f0-9]{8,}\.[a-z]{2,4})", html)
    return sorted(set(hex_chunks + named_chunks))


def extract_static_assets(html: str) -> list[str]:
    """Extract all unique /_next/static/ asset paths (fonts, chunks, etc.)."""
    # Require at least one / after /_next/static/ and a clean file extension at the end
    matches = re.findall(r'/_next/static/(?:chunks|media|css)/([a-zA-Z0-9_.%-]+\.[a-z0-9]{2,5})', html)
    return sorted(set(matches))


def content_hash(body: str) -> str:
    """SHA-256 of the response body (first 12 hex chars for brevity)."""
    return hashlib.sha256(body.encode()).hexdigest()[:12]


def load_json(path: str, default):
    """Load JSON from file or return default if missing/corrupt."""
    if not os.path.isfile(path):
        return default
    try:
        with open(path) as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return default


def save_json(path: str, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def git_push(data_updated: bool = False):
    """Commit and push updated tracker + data files."""
    base = os.path.dirname(os.path.abspath(__file__))
    files_to_add = ["build_state.json", "build_log.json"]
    if data_updated:
        files_to_add.extend(["stabilization_log.csv", "state_log.csv", "latest_state.json"])
    try:
        subprocess.run(["git", "add"] + files_to_add, cwd=base, check=True)
        result = subprocess.run(
            ["git", "commit", "-m", f"data: update {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}"],
            cwd=base, capture_output=True, text=True,
        )
        if "nothing to commit" in result.stdout:
            print("  No changes to commit.")
            return
        subprocess.run(["git", "push"], cwd=base, check=True)
        print("  Pushed changes to GitHub.")
    except subprocess.CalledProcessError as exc:
        print(f"[WARN] Git push failed: {exc}")


# ---------------------------------------------------------------------------
# API data recording (state + stabilization → CSV)
# ---------------------------------------------------------------------------
def fetch_json(url: str, timeout: int = 15) -> dict | None:
    """Fetch a JSON API endpoint, return parsed dict or None on failure."""
    req = Request(url, headers={"User-Agent": "Marathon-ARG-Monitor/1.0"})
    try:
        with urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        print(f"[WARN] API fetch failed ({url}): {exc}")
        return None


def get_timestamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def last_csv_row(filepath: str) -> dict:
    """Read the last data row of a CSV file as a dict. Returns {} if empty/missing."""
    if not os.path.isfile(filepath):
        return {}
    try:
        with open(filepath, newline="") as f:
            rows = list(csv.DictReader(f))
        return rows[-1] if rows else {}
    except Exception:
        return {}


def last_csv_timestamp(filepath: str) -> datetime | None:
    """Parse the timestamp from the last CSV row."""
    row = last_csv_row(filepath)
    ts = row.get("timestamp", "")
    if not ts:
        return None
    try:
        return datetime.strptime(ts, "%Y-%m-%d %H:%M:%S UTC").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def append_stabilization(stab_data: dict):
    """Append one row to stabilization_log.csv."""
    timestamp = get_timestamp()
    file_exists = os.path.isfile(STABILIZATION_CSV)
    with open(STABILIZATION_CSV, mode="a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            header = ["timestamp"]
            for cam in CAMERAS:
                header.extend([f"{cam}_stabilizationLevel", f"{cam}_nextStabilizationAt"])
            writer.writerow(header)
        row = [timestamp]
        for cam in CAMERAS:
            cam_data = stab_data.get(cam, {})
            row.append(cam_data.get("stabilizationLevel", "N/A"))
            row.append(cam_data.get("nextStabilizationAt", "N/A"))
        writer.writerow(row)
    print(f"  [{timestamp}] Stabilization data recorded.")


def append_state(state_data: dict):
    """Append one row to state_log.csv."""
    timestamp = get_timestamp()
    file_exists = os.path.isfile(STATE_CSV)
    with open(STATE_CSV, mode="a", newline="") as f:
        writer = csv.writer(f)
        if not file_exists:
            header = ["timestamp", "shipDate", "memoryUnlocked", "memoryCompleted",
                      "uescKillCount", "uescKillCountNextUpdateAt"]
            for page in PAGES:
                header.extend([f"{page}_unlocked", f"{page}_completed"])
            writer.writerow(header)
        pages = state_data.get("pages", {})
        row = [
            timestamp,
            state_data.get("shipDate", "N/A"),
            state_data.get("memoryUnlocked", "N/A"),
            state_data.get("memoryCompleted", "N/A"),
            state_data.get("uescKillCount", "N/A"),
            state_data.get("uescKillCountNextUpdateAt", "N/A"),
        ]
        for page in PAGES:
            page_data = pages.get(page, {})
            row.append(page_data.get("unlocked", "N/A"))
            row.append(page_data.get("completed", "N/A"))
        writer.writerow(row)
    print(f"  [{timestamp}] State data recorded.")


def write_latest_state(state_data: dict):
    """Write a lightweight JSON snapshot for client-side consumption."""
    save_json(LATEST_STATE_FILE, {
        "uescKillCount": state_data.get("uescKillCount"),
        "uescKillCountNextUpdateAt": state_data.get("uescKillCountNextUpdateAt"),
        "shipDate": state_data.get("shipDate"),
        "lastRecorded": get_timestamp(),
    })
    print(f"  latest_state.json updated.")


def state_changed(state_data: dict) -> bool:
    """Check if kill count or any sector status differs from last CSV entry."""
    prev = last_csv_row(STATE_CSV)
    if not prev:
        return True
    if str(state_data.get("uescKillCount", "")) != prev.get("uescKillCount", ""):
        return True
    pages = state_data.get("pages", {})
    for page in PAGES:
        page_data = pages.get(page, {})
        if str(page_data.get("unlocked", "")) != prev.get(f"{page}_unlocked", ""):
            return True
        if str(page_data.get("completed", "")) != prev.get(f"{page}_completed", ""):
            return True
    return False


def stab_changed(stab_data: dict) -> bool:
    """Check if any stabilization level differs from last CSV entry."""
    prev = last_csv_row(STABILIZATION_CSV)
    if not prev:
        return True
    for cam in CAMERAS:
        cam_data = stab_data.get(cam, {})
        if str(cam_data.get("stabilizationLevel", "")) != prev.get(f"{cam}_stabilizationLevel", ""):
            return True
    return False


def record_api_data() -> bool:
    """Fetch state + stabilization APIs and append to CSVs if needed.

    Records when: data changed, OR >= 14 min since last entry.
    Returns True if data was written.
    """
    stab_raw = fetch_json(STABILIZATION_URL)
    state_raw = fetch_json(STATE_API_URL)

    stab_data = stab_raw.get("stabilization", {}) if stab_raw else {}
    state_data = state_raw.get("state", {}) if state_raw else {}

    if not stab_data and not state_data:
        print("  [WARN] Both API calls failed — skipping data recording.")
        return False

    # Determine if we should record
    last_ts = last_csv_timestamp(STATE_CSV) or last_csv_timestamp(STABILIZATION_CSV)
    elapsed = None
    if last_ts:
        elapsed = (datetime.now(timezone.utc) - last_ts).total_seconds()

    time_due = elapsed is None or elapsed >= RECORD_INTERVAL_SECS
    value_changed = (state_data and state_changed(state_data)) or (stab_data and stab_changed(stab_data))

    if not time_due and not value_changed:
        print(f"  API data unchanged, {int(RECORD_INTERVAL_SECS - (elapsed or 0))}s until next recording.")
        return False

    reason = "value change" if value_changed else "scheduled interval"
    print(f"  Recording API data ({reason})...")

    if stab_data:
        append_stabilization(stab_data)
    if state_data:
        append_state(state_data)
        write_latest_state(state_data)

    return True


# ---------------------------------------------------------------------------
# Main logic
# ---------------------------------------------------------------------------
def run():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{now}] Checking {SITE_URL} ...")

    # ----- Part 1: API data recording (state + stabilization) -----
    data_updated = record_api_data()

    # ----- Part 2: Build change detection -----
    print(f"  Checking for build changes...")
    status, headers, body = fetch(SITE_URL)
    if status != 200:
        print(f"[ERROR] Got HTTP {status} from {SITE_URL}")
        # Still push data if we recorded any
        if data_updated:
            git_push(data_updated=True)
        sys.exit(1)

    # 2. Extract build fingerprints
    deployment_id = extract_deployment_id(body)
    etag = headers.get("etag", "").strip('"')
    chunks = extract_chunks(body)
    assets = extract_static_assets(body)
    page_hash = content_hash(body)

    print(f"  Deployment ID : {deployment_id or 'not found'}")
    print(f"  ETag          : {etag or 'none'}")
    print(f"  Chunks        : {len(chunks)}")
    print(f"  Static assets : {len(assets)}")
    print(f"  Page hash     : {page_hash}")

    # 3. Load previous state
    prev = load_json(BUILD_STATE_FILE, {})
    log = load_json(BUILD_LOG_FILE, [])

    # 4. Detect changes — only deployment ID and chunks are stable signals.
    #    ETag and page_hash vary per CDN edge/request and would cause false positives.
    changed = False
    changes = []

    if prev.get("deployment_id") != deployment_id and deployment_id:
        changes.append(f"Deployment ID: {prev.get('deployment_id', 'none')} → {deployment_id}")
        changed = True

    prev_chunks = set(prev.get("chunks", []))
    curr_chunks = set(chunks)
    added_chunks = sorted(curr_chunks - prev_chunks)
    removed_chunks = sorted(prev_chunks - curr_chunks)
    if added_chunks or removed_chunks:
        if added_chunks:
            changes.append(f"New chunks: {', '.join(added_chunks)}")
        if removed_chunks:
            changes.append(f"Removed chunks: {', '.join(removed_chunks)}")
        changed = True

    # If no previous state, this is the initial snapshot — always record it
    if not prev:
        changed = True
        changes = ["Initial build snapshot"]

    # 5. Record if changed
    if changed:
        print(f"  ** BUILD CHANGE DETECTED **")
        for c in changes:
            print(f"     - {c}")

        entry = {
            "detected_at": now,
            "deployment_id": deployment_id,
            "etag": etag,
            "page_hash": page_hash,
            "chunk_count": len(chunks),
            "asset_count": len(assets),
            "changes": changes,
            "http_status": status,
        }
        if added_chunks:
            entry["chunks_added"] = added_chunks
        if removed_chunks:
            entry["chunks_removed"] = removed_chunks

        log.append(entry)
        save_json(BUILD_LOG_FILE, log)

        state = {
            "deployment_id": deployment_id,
            "etag": etag,
            "page_hash": page_hash,
            "chunks": chunks,
            "assets": assets,
            "last_checked": now,
            "last_changed": now,
        }
        save_json(BUILD_STATE_FILE, state)
        build_changed = True
    else:
        print("  No build changes detected.")
        # Update last_checked timestamp even if no change
        prev["last_checked"] = now
        save_json(BUILD_STATE_FILE, prev)
        build_changed = False

    # ----- Commit & push if anything changed -----
    if build_changed or data_updated:
        git_push(data_updated=data_updated)


if __name__ == "__main__":
    run()
