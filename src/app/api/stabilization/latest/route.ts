import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { withCache } from "@/lib/cache";

/**
 * GET /api/stabilization/latest
 *
 * Returns the latest stabilization snapshot from the database.
 * Data is populated by the Python poller every 5 minutes — no live fallback.
 */
export async function GET() {
    // Try database first
    const db = getPool();
    if (db) {
        try {
            const result = await db.query(
                `SELECT captured_at, cameras, next_stabilization
         FROM stabilization_snapshots
         ORDER BY captured_at DESC
         LIMIT 1`
            );

            if (result.rows.length > 0) {
                const row = result.rows[0];
                return withCache(NextResponse.json({
                    data: {
                        capturedAt: row.captured_at,
                        cameras: row.cameras,
                        nextStabilization: row.next_stabilization,
                    },
                    source: "database",
                }), "realtime");
            }
        } catch (err) {
            console.error("Failed to query latest stabilization from DB:", err);
        }
    }

    // No data in DB yet — poller hasn't run
    return NextResponse.json(
        { error: "No stabilization data available yet — poller may not have run", data: null, source: "empty" },
        { status: 503 }
    );
}
