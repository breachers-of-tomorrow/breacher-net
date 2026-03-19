import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { parseLimit, parseSince, isErrorResponse } from "@/lib/validation";
import { withCache } from "@/lib/cache";

/**
 * GET /api/steam/history?limit=500&since=2025-01-01T00:00:00Z
 *
 * Returns historical Steam player count snapshots for Marathon.
 * Used by the PlayerCountChart to graph players over time.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const limit = parseLimit(searchParams.get("limit"), 500, 2000);
  if (isErrorResponse(limit)) return limit;

  const since = parseSince(searchParams.get("since"));
  if (isErrorResponse(since)) return since;

  const MARATHON_APP_ID = 3065800;

  const db = getPool();
  if (!db) {
    return NextResponse.json({
      data: [],
      source: "none",
      message: "Database not configured",
    });
  }

  try {
    let query: string;
    let params: (string | number)[];

    if (since) {
      query = `
        SELECT captured_at, player_count
        FROM steam_snapshots
        WHERE app_id = $1 AND captured_at >= $2
        ORDER BY captured_at DESC LIMIT $3
      `;
      params = [MARATHON_APP_ID, since, limit];
    } else {
      query = `
        SELECT captured_at, player_count
        FROM steam_snapshots
        WHERE app_id = $1
        ORDER BY captured_at DESC LIMIT $2
      `;
      params = [MARATHON_APP_ID, limit];
    }

    const result = await db.query(query, params);

    return withCache(
      NextResponse.json({
        data: result.rows,
        count: result.rowCount,
        source: "database",
      }),
      "standard",
    );
  } catch (err) {
    console.error("Failed to query steam history:", err);
    return NextResponse.json(
      { error: "Database query failed", data: [], source: "error" },
      { status: 500 },
    );
  }
}
