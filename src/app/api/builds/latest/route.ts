import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { withCache } from "@/lib/cache";

/**
 * GET /api/builds/latest
 *
 * Returns the most recent build event from the database.
 */
export async function GET() {
    const db = getPool();
    if (!db) {
        return NextResponse.json({
            data: null,
            source: "none",
            message: "Database not configured",
        });
    }

    try {
        const result = await db.query(
            `SELECT id, detected_at, build_hash, build_version, summary, details, headers
       FROM build_events
       ORDER BY detected_at DESC
       LIMIT 1`
        );

        return withCache(NextResponse.json({
            data: result.rows[0] ?? null,
            source: "database",
        }), "realtime");
    } catch (err) {
        console.error("Failed to query latest build event:", err);
        return NextResponse.json(
            { error: "Database query failed", data: null, source: "error" },
            { status: 500 }
        );
    }
}
