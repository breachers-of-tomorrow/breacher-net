import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { fetchState } from "@/lib/api";

/**
 * GET /api/state/latest
 *
 * Returns the latest state — from the database if available, otherwise live from the API.
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

    // Fallback to live API
    const state = await fetchState();
    if (!state) {
        return NextResponse.json(
            { error: "Unable to fetch state", data: null, source: "error" },
            { status: 502 }
        );
    }

    return NextResponse.json({
        data: {
            capturedAt: new Date().toISOString(),
            killCount: state.uescKillCount,
            shipDate: state.shipDate,
            nextUpdate: state.uescKillCountNextUpdateAt,
            sectors: state.pages,
            memoryFlags: {
                memoryUnlocked: state.memoryUnlocked,
                memoryCompleted: state.memoryCompleted,
            },
        },
        source: "live-api",
    });
}
