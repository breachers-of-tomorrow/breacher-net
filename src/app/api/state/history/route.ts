import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

/**
 * GET /api/state/history?limit=100&since=2025-01-01T00:00:00Z
 *
 * Returns historical state snapshots from the database.
 * Falls back to empty array if no database is configured.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 1000);
  const since = searchParams.get("since");

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
      SELECT captured_at, kill_count, ship_date, next_update, build_version, sectors, memory_flags
      FROM state_snapshots
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

    return NextResponse.json({
      data: result.rows,
      count: result.rowCount,
      source: "database",
    });
  } catch (err) {
    console.error("Failed to query state history:", err);
    return NextResponse.json(
      { error: "Database query failed", data: [], source: "error" },
      { status: 500 }
    );
  }
}
