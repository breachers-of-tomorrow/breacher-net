import { Pool } from "pg";

/**
 * Database connection pool.
 * Only created when DATABASE_URL is set — the app gracefully falls back
 * to direct API calls when no database is configured.
 */

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      // Kill queries that run longer than 10 seconds
      statement_timeout: 10_000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected database pool error:", err);
    });
  }

  return pool;
}

/**
 * Check if the database is available and has data.
 */
export async function isDatabaseReady(): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    const result = await db.query(
      "SELECT EXISTS(SELECT 1 FROM state_snapshots LIMIT 1) AS has_data"
    );
    return result.rows[0]?.has_data ?? false;
  } catch {
    return false;
  }
}
