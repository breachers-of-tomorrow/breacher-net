import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { parseLimit, parseSince, isErrorResponse } from "@/lib/validation";
import { withCache } from "@/lib/cache";

/**
 * GET /api/stabilization/history?limit=100&since=2025-01-01T00:00:00Z
 *
 * Returns historical stabilization snapshots from the database.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const limit = parseLimit(searchParams.get("limit"), 100, 1000);
  if (isErrorResponse(limit)) return limit;

  const since = parseSince(searchParams.get("since"));
  if (isErrorResponse(since)) return since;

  const db = getPool();
  if (!db) {
    return NextResponse.json({
      data: [],
      source: "none",
      message: "Database not configured",
    });
  }

  try {
    let query = `
      SELECT captured_at, cameras, next_stabilization
      FROM stabilization_snapshots
    `;
    const params: (string | number)[] = [];

    if (since) {
      query += " WHERE captured_at >= $1";
      params.push(since);
      query += " ORDER BY captured_at DESC LIMIT $2";
      params.push(limit);
    } else {
      query += " ORDER BY captured_at DESC LIMIT $1";
      params.push(limit);
    }

    const result = await db.query(query, params);

    return withCache(NextResponse.json({
      data: result.rows,
      count: result.rowCount,
      source: "database",
    }), "standard");
  } catch (err) {
    console.error("Failed to query stabilization history:", err);
    return NextResponse.json(
      { error: "Database query failed", data: [], source: "error" },
      { status: 500 }
    );
  }
}
