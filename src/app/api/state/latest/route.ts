import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { withCache } from "@/lib/cache";

/**
 * GET /api/state/latest
 *
 * Returns the high-water-mark state snapshot from the database.
 * Uses ORDER BY kill_count DESC instead of captured_at DESC because
 * the upstream API may return stale/regressed data, causing the most
 * recent row to have a LOWER kill count than older rows.
 *
 * Data is populated by the Python poller every 15 minutes — no live fallback.
 */
export async function GET() {
    // Try database first
    const db = getPool();
    if (db) {
        try {
            const result = await db.query(
                `SELECT captured_at, kill_count, ship_date, next_update, sectors, memory_flags
         FROM state_snapshots
         ORDER BY kill_count DESC
         LIMIT 1`
            );

            if (result.rows.length > 0) {
                const row = result.rows[0];
                return withCache(NextResponse.json({
                    data: {
                        capturedAt: row.captured_at,
                        killCount: row.kill_count,
                        shipDate: row.ship_date,
                        nextUpdate: row.next_update,
                        sectors: row.sectors,
                        memoryFlags: row.memory_flags,
                    },
                    source: "database",
                }), "realtime");
            }
        } catch (err) {
            console.error("Failed to query latest state from DB:", err);
        }
    }

    // No data in DB yet — poller hasn't run
    return NextResponse.json(
        { error: "No state data available yet — poller may not have run", data: null, source: "empty" },
        { status: 503 }
    );
}
