import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

/**
 * GET /api/builds?limit=50
 *
 * Returns build change events from the database.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

  const db = getPool();
  if (!db) {
    return NextResponse.json({
      data: [],
      source: "none",
      message: "Database not configured",
    });
  }

  try {
    const result = await db.query(
      `SELECT id, detected_at, build_hash, build_version, summary, details, headers
       FROM build_events
       ORDER BY detected_at DESC
       LIMIT $1`,
      [limit]
    );

    return NextResponse.json({
      data: result.rows,
      count: result.rowCount,
      source: "database",
    });
  } catch (err) {
    console.error("Failed to query build events:", err);
    return NextResponse.json(
      { error: "Database query failed", data: [], source: "error" },
      { status: 500 }
    );
  }
}
