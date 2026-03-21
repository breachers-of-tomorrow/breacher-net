"""Local JSON buffer for poller data when the database is unavailable.

Provides a safety net so data polled from upstream APIs is never lost due
to transient database outages.  Each write attempt that fails is appended
to a local JSONL file (one JSON object per line).  On the next successful
DB connection, buffered rows are flushed first.

File layout::

    /data/buffer/state_snapshots.jsonl
    /data/buffer/stabilization_snapshots.jsonl
    /data/buffer/steam_snapshots.jsonl
    /data/buffer/build_events.jsonl
    /data/buffer/index_entries.jsonl
    /data/buffer/index_snapshots.jsonl

Environment variables:

    POLLER_BUFFER_DIR
        Directory for buffer files.  Defaults to ``/data/buffer``.
        Mount a persistent volume here in K8s.

    POLLER_BUFFER_MAX_BYTES
        Maximum size in bytes per buffer file.  When a file exceeds this
        limit, the oldest lines are dropped to make room.  Defaults to
        ``52428800`` (50 MiB).  Set to ``0`` to disable the size cap.
"""

import json
import logging
import os
import tempfile
from pathlib import Path

log = logging.getLogger(__name__)

BUFFER_DIR = Path(os.environ.get("POLLER_BUFFER_DIR", "/data/buffer"))
BUFFER_MAX_BYTES = int(os.environ.get("POLLER_BUFFER_MAX_BYTES", str(50 * 1024 * 1024)))


def _buffer_path(table: str) -> Path:
    """Return the buffer file path for a given table name."""
    safe = table.replace("/", "_").replace("..", "_")
    return BUFFER_DIR / f"{safe}.jsonl"


def _ensure_dir() -> None:
    """Create the buffer directory if it doesn't exist."""
    BUFFER_DIR.mkdir(parents=True, exist_ok=True)


def _enforce_max_size(path: Path) -> None:
    """Trim oldest lines from *path* until it fits within BUFFER_MAX_BYTES.

    Strategy: when the file exceeds the limit, keep only the newest lines
    that fit within the cap.  This is an O(n) operation but only triggers
    on overflow, which should be rare in practice.
    """
    if BUFFER_MAX_BYTES <= 0:
        return  # no cap

    try:
        size = path.stat().st_size
    except FileNotFoundError:
        return

    if size <= BUFFER_MAX_BYTES:
        return

    log.warning(
        "Buffer %s exceeds max size (%d > %d bytes) — trimming oldest entries",
        path.name, size, BUFFER_MAX_BYTES,
    )

    # Read all lines and keep the tail that fits
    with open(path, "r") as f:
        lines = f.readlines()

    kept: list[str] = []
    kept_size = 0
    for line in reversed(lines):
        line_bytes = len(line.encode("utf-8"))
        if kept_size + line_bytes > BUFFER_MAX_BYTES:
            break
        kept.append(line)
        kept_size += line_bytes

    kept.reverse()
    dropped = len(lines) - len(kept)

    # Atomic write: write to temp file then rename
    tmp_fd, tmp_path = tempfile.mkstemp(dir=BUFFER_DIR, suffix=".tmp")
    try:
        with os.fdopen(tmp_fd, "w") as tmp:
            tmp.writelines(kept)
        os.replace(tmp_path, str(path))
    except Exception:
        # Clean up temp file on failure
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise

    log.info("Trimmed %d oldest entries from %s (kept %d)", dropped, path.name, len(kept))


def buffer_row(table: str, params: dict) -> None:
    """Append a single row to the buffer file for *table*.

    Parameters
    ----------
    table:
        Database table name (e.g. ``"state_snapshots"``).
    params:
        Dictionary of column names → values.  Values must be
        JSON-serializable.  Timestamps should be ISO 8601 strings.
    """
    _ensure_dir()
    path = _buffer_path(table)

    row = {"table": table, "params": params}
    line = json.dumps(row, default=str) + "\n"

    try:
        with open(path, "a") as f:
            f.write(line)
        log.debug("Buffered 1 row to %s", path.name)
    except Exception:
        log.exception("Failed to write buffer file %s", path.name)
        return

    # Enforce size cap after write
    try:
        _enforce_max_size(path)
    except Exception:
        log.exception("Failed to trim buffer file %s", path.name)


def read_buffered(table: str) -> list[dict]:
    """Read all buffered rows for *table*.  Returns a list of param dicts."""
    path = _buffer_path(table)
    if not path.exists():
        return []

    rows: list[dict] = []
    with open(path, "r") as f:
        for lineno, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                rows.append(obj.get("params", obj))
            except json.JSONDecodeError:
                log.warning("Skipping corrupt buffer line %d in %s", lineno, path.name)
    return rows


def clear_buffer(table: str) -> int:
    """Remove the buffer file for *table*.  Returns the number of rows cleared."""
    path = _buffer_path(table)
    if not path.exists():
        return 0

    count = 0
    with open(path, "r") as f:
        for line in f:
            if line.strip():
                count += 1

    path.unlink()
    log.info("Cleared %d buffered rows from %s", count, path.name)
    return count


def buffered_count(table: str) -> int:
    """Return the number of buffered rows for *table* without loading them."""
    path = _buffer_path(table)
    if not path.exists():
        return 0

    count = 0
    with open(path, "r") as f:
        for line in f:
            if line.strip():
                count += 1
    return count


def buffered_tables() -> list[str]:
    """Return a list of table names that have buffered data."""
    if not BUFFER_DIR.exists():
        return []

    tables = []
    for p in BUFFER_DIR.glob("*.jsonl"):
        if p.stat().st_size > 0:
            tables.append(p.stem)
    return tables
