import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { withCache } from "@/lib/cache";

interface TableFreshness {
  table: string;
  label: string;
  lastUpdated: string | null;
}

interface PollerHeartbeat {
  pollerName: string;
  heartbeatAt: string;
  status: string;
  details: string | null;
}

/**
 * GET /api/status
 *
 * Returns infrastructure health and data freshness for the status page.
 */
export async function GET() {
  const db = getPool();

  if (!db) {
    return withCache(
      NextResponse.json({
        status: "standalone",
        timestamp: new Date().toISOString(),
        database: { connected: false },
        freshness: [],
        pollers: [],
      }),
      "none",
    );
  }

  let dbConnected = false;
  const freshness: TableFreshness[] = [];
  const pollers: PollerHeartbeat[] = [];

  try {
    // DB connectivity check (no latency exposed externally)
    await db.query("SELECT 1");
    dbConnected = true;

    // Query freshness for each data table
    const freshnessQueries = [
      {
        table: "state_snapshots",
        label: "State Poller",
        sql: "SELECT MAX(captured_at) AS last_updated FROM state_snapshots",
      },
      {
        table: "stabilization_snapshots",
        label: "Stabilization Data",
        sql: "SELECT MAX(captured_at) AS last_updated FROM stabilization_snapshots",
      },
      {
        table: "steam_snapshots",
        label: "Steam Player Count",
        sql: "SELECT MAX(captured_at) AS last_updated FROM steam_snapshots",
      },
      {
        table: "build_events",
        label: "Build Tracker",
        sql: "SELECT MAX(detected_at) AS last_updated FROM build_events",
      },
      {
        table: "index_entries",
        label: "Index Archive",
        sql: "SELECT MAX(last_updated) AS last_updated FROM index_entries",
      },
      {
        table: "index_snapshots",
        label: "Index Snapshots",
        sql: "SELECT MAX(captured_at) AS last_updated FROM index_snapshots",
      },
    ];

    for (const q of freshnessQueries) {
      try {
        const result = await db.query(q.sql);
        const row = result.rows[0];
        freshness.push({
          table: q.table,
          label: q.label,
          lastUpdated: row?.last_updated?.toISOString() ?? null,
        });
      } catch {
        freshness.push({
          table: q.table,
          label: q.label,
          lastUpdated: null,
        });
      }
    }

    // Query poller heartbeats (if table exists)
    try {
      const heartbeatResult = await db.query(
        `SELECT poller_name, heartbeat_at, status, details
         FROM poller_heartbeats
         ORDER BY heartbeat_at DESC
         LIMIT 10`,
      );
      for (const row of heartbeatResult.rows) {
        pollers.push({
          pollerName: row.poller_name,
          heartbeatAt: row.heartbeat_at?.toISOString(),
          status: row.status,
          details: row.details,
        });
      }
    } catch {
      // poller_heartbeats table may not exist yet — not fatal
    }
  } catch {
    dbConnected = false;
  }

  const status = dbConnected ? "healthy" : "degraded";

  return withCache(
    NextResponse.json({
      status,
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
      },
      freshness,
      pollers,
    }),
    "standard",
  );
}
