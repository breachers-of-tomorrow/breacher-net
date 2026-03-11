#!/usr/bin/env python3
"""
Bungie Build Tracker for cryoarchive.systems

Fetches the Marathon ARG site, extracts the Vercel deployment ID and
chunk hashes, and logs changes to build_log.json when a new build is
detected.  Designed to run in GitHub Actions on a schedule.
"""

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
SITE_URL = "https://cryoarchive.systems"
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "build_state.json")
LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "build_log.json")


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


def git_push():
    """Commit and push updated build tracker files."""
    base = os.path.dirname(os.path.abspath(__file__))
    try:
        subprocess.run(
            ["git", "add", "build_state.json", "build_log.json"],
            cwd=base, check=True,
        )
        result = subprocess.run(
            ["git", "commit", "-m", f"build: site change detected {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}"],
            cwd=base, capture_output=True, text=True,
        )
        if "nothing to commit" in result.stdout:
            print("  No changes to commit.")
            return
        subprocess.run(["git", "push"], cwd=base, check=True)
        print("  Pushed build change to GitHub.")
    except subprocess.CalledProcessError as exc:
        print(f"[WARN] Git push failed: {exc}")


# ---------------------------------------------------------------------------
# Main logic
# ---------------------------------------------------------------------------
def run():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"[{now}] Checking {SITE_URL} for build changes...")

    # 1. Fetch the main page
    status, headers, body = fetch(SITE_URL)
    if status != 200:
        print(f"[ERROR] Got HTTP {status} from {SITE_URL}")
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
    prev = load_json(STATE_FILE, {})
    log = load_json(LOG_FILE, [])

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
        save_json(LOG_FILE, log)

        state = {
            "deployment_id": deployment_id,
            "etag": etag,
            "page_hash": page_hash,
            "chunks": chunks,
            "assets": assets,
            "last_checked": now,
            "last_changed": now,
        }
        save_json(STATE_FILE, state)

        git_push()
    else:
        print("  No build changes detected.")
        # Update last_checked timestamp even if no change
        prev["last_checked"] = now
        save_json(STATE_FILE, prev)


if __name__ == "__main__":
    run()
