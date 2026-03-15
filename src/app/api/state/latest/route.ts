import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

/**
 * GET /api/state/latest
 *
 * Returns the latest state snapshot from the database.
 * Data is populated by the Python poller every 5 minutes — no live fallback.
 */
export async function GET() {
    // Try database first
    const db = getPool();
    if (db) {
        try {
            const result = await db.query(
                `SELECT captured_at, kill_count, ship_date, next_update, sectors, memory_flags
         FROM state_snapshots
         ORDER BY captured_at DESC
         LIMIT 1`
            );

            if (result.rows.length > 0) {
                const row = result.rows[0];
                return NextResponse.json({
                    data: {
                        capturedAt: row.captured_at,
                        killCount: row.kill_count,
                        shipDate: row.ship_date,
                        nextUpdate: row.next_update,
                        sectors: row.sectors,
                        memoryFlags: row.memory_flags,
                    },
                    source: "database",
                });
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
