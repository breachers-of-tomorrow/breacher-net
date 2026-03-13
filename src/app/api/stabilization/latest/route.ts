import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { fetchStabilization } from "@/lib/api";

/**
 * GET /api/stabilization/latest
 *
 * Returns the latest camera stabilization levels — from DB if available, otherwise live.
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
                return NextResponse.json({
                    data: {
                        capturedAt: row.captured_at,
                        cameras: row.cameras,
                        nextStabilization: row.next_stabilization,
                    },
                    source: "database",
                });
            }
        } catch (err) {
            console.error("Failed to query latest stabilization from DB:", err);
        }
    }

    // Fallback to live API
    const stabilization = await fetchStabilization();
    if (!stabilization) {
        return NextResponse.json(
            { error: "Unable to fetch stabilization", data: null, source: "error" },
            { status: 502 }
        );
    }

    return NextResponse.json({
        data: {
            capturedAt: new Date().toISOString(),
            cameras: stabilization,
        },
        source: "live-api",
    });
}
