import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/index
 *
 * Returns index entries from the database.
 * Query params:
 *   status — "locked" | "unlocked" | "all" (default: "all")
 *   type — "IMAGE" | "TEXT" | "VIDEO" | "AUDIO" (filter by type)
 */
export async function GET(request: Request) {
    const pool = getPool();
    if (!pool) {
        return NextResponse.json(
            { error: "Database not configured" },
            { status: 503 }
        );
    }

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get("status") || "all";
    const typeFilter = url.searchParams.get("type");

    try {
        // Get summary stats
        const statsResult = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'unlocked') AS unlocked,
        COUNT(*) FILTER (WHERE status = 'locked') AS locked,
        COUNT(*) FILTER (WHERE entry_type = 'IMAGE') AS images,
        COUNT(*) FILTER (WHERE entry_type = 'TEXT') AS texts,
        COUNT(*) FILTER (WHERE entry_type = 'VIDEO') AS videos,
        COUNT(*) FILTER (WHERE entry_type = 'AUDIO') AS audio
      FROM index_entries
    `);

        const stats = statsResult.rows[0] ?? {
            total: 0, unlocked: 0, locked: 0,
            images: 0, texts: 0, videos: 0, audio: 0,
        };

        // Build entry query with filters
        const conditions: string[] = [];
        const params: (string | number)[] = [];
        let paramIdx = 1;

        if (statusFilter !== "all") {
            conditions.push(`status = $${paramIdx}`);
            params.push(statusFilter);
            paramIdx++;
        }

        if (typeFilter) {
            conditions.push(`entry_type = $${paramIdx}`);
            params.push(typeFilter.toUpperCase());
            paramIdx++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const entriesResult = await pool.query(
            `SELECT entry_id, entry_type, status, first_seen, last_updated, content_data
       FROM index_entries
       ${whereClause}
       ORDER BY entry_id ASC`,
            params
        );

        return NextResponse.json({
            stats: {
                total: Number(stats.total),
                unlocked: Number(stats.unlocked),
                locked: Number(stats.locked),
                types: {
                    IMAGE: Number(stats.images),
                    TEXT: Number(stats.texts),
                    VIDEO: Number(stats.videos),
                    AUDIO: Number(stats.audio),
                },
            },
            entries: entriesResult.rows,
            fetchedAt: new Date().toISOString(),
            source: "database" as const,
        });
    } catch (err) {
        console.error("Failed to query index entries:", err);
        return NextResponse.json(
            { error: "Failed to query index data" },
            { status: 500 }
        );
    }
}
