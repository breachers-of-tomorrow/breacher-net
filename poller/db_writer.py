"""Shared database helpers with automatic buffer fallback.

Wraps psycopg2 operations so that:
1. Before any insert, buffered rows for that table are flushed first
2. If the DB is unreachable, the row is saved to the local JSON buffer
3. Heartbeats are recorded with buffer status metadata

Usage::

    from db_writer import insert_row, record_heartbeat

    insert_row(
        table="state_snapshots",
        columns=["kill_count", "ship_date", "raw_response"],
        values=[476291, "JUL 23 2026", '{"state": {...}}'],
        params_dict={"kill_count": 476291, "ship_date": "JUL 23 2026", ...},
    )
"""

import json
import logging
import os

import psycopg2

from buffer import (
    buffer_row,
    buffered_count,
    buffered_tables,
    clear_buffer,
    read_buffered,
)

log = logging.getLogger(__name__)

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://breacher:mycomplexpassword@db:5432/breacher",
)


def get_db():
    """Get a database connection."""
    return psycopg2.connect(DATABASE_URL)


def _try_connect():
    """Attempt a DB connection.  Returns (conn, None) or (None, error)."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn, None
    except Exception as e:
        return None, e


def _flush_buffer(conn, table: str) -> int:
    """Flush buffered rows for *table* into the database.

    Returns the number of rows successfully flushed.
    """
    rows = read_buffered(table)
    if not rows:
        return 0

    flushed = 0
    for row in rows:
        columns = list(row.keys())
        values = list(row.values())
        placeholders = ", ".join(["%s"] * len(columns))
        col_names = ", ".join(columns)
        sql = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})"

        try:
            with conn.cursor() as cur:
                cur.execute(sql, values)
            conn.commit()
            flushed += 1
        except Exception:
            conn.rollback()
            log.warning("Failed to flush buffered row to %s — stopping flush", table)
            break

    if flushed == len(rows):
        clear_buffer(table)
        log.info("Flushed all %d buffered rows to %s", flushed, table)
    elif flushed > 0:
        # Partial flush: rewrite buffer with remaining rows
        clear_buffer(table)
        for remaining_row in rows[flushed:]:
            buffer_row(table, remaining_row)
        log.info(
            "Partially flushed %d/%d buffered rows to %s",
            flushed, len(rows), table,
        )

    return flushed


def insert_row(
    table: str,
    columns: list[str],
    values: list,
    *,
    params_dict: dict | None = None,
    on_conflict: str = "",
) -> bool:
    """Insert a row into *table*, falling back to buffer on failure.

    Parameters
    ----------
    table:
        Target table name.
    columns:
        Column names for the INSERT.
    values:
        Corresponding values (same order as *columns*).
    params_dict:
        Optional dict representation for buffering.  If not provided,
        one is built from *columns* and *values*.
    on_conflict:
        Optional ``ON CONFLICT ...`` clause appended to the INSERT.

    Returns True if the row was written to the DB, False if buffered.
    """
    if params_dict is None:
        params_dict = {}
        for col, val in zip(columns, values):
            # Serialize non-primitive types for JSON storage
            if isinstance(val, (dict, list)):
                params_dict[col] = val
            else:
                params_dict[col] = val

    conn, err = _try_connect()
    if conn is None:
        log.warning("DB unavailable (%s) — buffering row for %s", err, table)
        buffer_row(table, params_dict)
        return False

    try:
        # Flush any previously buffered rows first
        _flush_buffer(conn, table)

        # Now insert the current row
        placeholders = ", ".join(["%s"] * len(columns))
        col_names = ", ".join(columns)
        sql = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})"
        if on_conflict:
            sql += f" {on_conflict}"

        with conn:
            with conn.cursor() as cur:
                cur.execute(sql, values)

        conn.close()
        return True
    except Exception:
        log.exception("Failed to insert row into %s — buffering", table)
        try:
            conn.close()
        except Exception:
            pass
        buffer_row(table, params_dict)
        return False


def insert_many(
    table: str,
    columns: list[str],
    rows: list[tuple],
    *,
    params_dicts: list[dict] | None = None,
    on_conflict: str = "",
) -> int:
    """Insert multiple rows, buffering any that fail.

    Returns the number of rows successfully written to the DB.
    """
    conn, err = _try_connect()
    if conn is None:
        log.warning("DB unavailable (%s) — buffering %d rows for %s", err, len(rows), table)
        for i, row_values in enumerate(rows):
            if params_dicts and i < len(params_dicts):
                buffer_row(table, params_dicts[i])
            else:
                buffer_row(table, dict(zip(columns, row_values)))
        return 0

    try:
        _flush_buffer(conn, table)
    except Exception:
        log.warning("Flush failed, continuing with current insert")

    placeholders = ", ".join(["%s"] * len(columns))
    col_names = ", ".join(columns)
    sql = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders})"
    if on_conflict:
        sql += f" {on_conflict}"

    written = 0
    try:
        with conn:
            with conn.cursor() as cur:
                for row_values in rows:
                    cur.execute(sql, row_values)
                    written += 1
        conn.close()
        return written
    except Exception:
        log.exception("Failed during batch insert into %s after %d rows", table, written)
        try:
            conn.close()
        except Exception:
            pass
        # Buffer the remaining rows
        for i, row_values in enumerate(rows):
            if i >= written:
                if params_dicts and i < len(params_dicts):
                    buffer_row(table, params_dicts[i])
                else:
                    buffer_row(table, dict(zip(columns, row_values)))
        return written


def record_heartbeat(poller_name: str, status: str = "ok", details: dict | None = None) -> None:
    """Record a poller heartbeat with buffer status metadata."""
    # Enrich details with buffer status
    if details is None:
        details = {}

    tables = buffered_tables()
    if tables:
        buffer_info = {t: buffered_count(t) for t in tables}
        details["buffered_rows"] = buffer_info
        if status == "ok":
            status = "ok_with_buffer"

    conn, err = _try_connect()
    if conn is None:
        log.warning("DB unavailable for heartbeat (%s)", err)
        return

    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO poller_heartbeats (poller_name, status, details)
                    VALUES (%s, %s, %s)
                    """,
                    (poller_name, status, json.dumps(details) if details else None),
                )
        conn.close()
    except Exception:
        log.exception("Failed to record heartbeat for %s", poller_name)
        try:
            conn.close()
        except Exception:
            pass
