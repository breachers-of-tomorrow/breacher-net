// ============================================================
// API client — reads polled data from the local PostgreSQL DB.
//
// All cryoarchive.systems data is fetched by the Python poller
// every 5 minutes and stored in the database.  No user or
// server-component request ever contacts cryoarchive directly.
//
// See: https://github.com/breachers-of-tomorrow/breacher-net/issues/49
// ============================================================

import { getPool } from "./db";
import type {
  CryoarchiveState,
  CameraStabilization,
  CameraName,
} from "./types";

/**
 * Get the latest state snapshot from the local database.
 * The raw_response JSONB column stores the original API payload,
 * so we can reconstruct the CryoarchiveState shape the server
 * components already expect.
 */
export async function fetchState(): Promise<CryoarchiveState | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const result = await pool.query(
      "SELECT raw_response FROM state_snapshots ORDER BY captured_at DESC LIMIT 1",
    );
    if (!result.rows.length) return null;
    return result.rows[0].raw_response?.state ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the latest stabilization snapshot from the local database.
 */
export async function fetchStabilization(): Promise<Record<
  CameraName,
  CameraStabilization
> | null> {
  const pool = getPool();
  if (!pool) return null;
  try {
    const result = await pool.query(
      "SELECT raw_response FROM stabilization_snapshots ORDER BY captured_at DESC LIMIT 1",
    );
    if (!result.rows.length) return null;
    return result.rows[0].raw_response?.stabilization ?? null;
  } catch {
    return null;
  }
}
