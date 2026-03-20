import { NextResponse } from "next/server";
import { getPool, isDatabaseReady } from "@/lib/db";
import { withCache } from "@/lib/cache";

/**
 * GET /api/health
 *
 * Health check endpoint for K8s probes and monitoring.
 */
export async function GET() {
  const dbPool = getPool();
  const dbConfigured = dbPool !== null;
  let dbConnected = false;

  if (dbConfigured) {
    try {
      await isDatabaseReady();
      dbConnected = true;
    } catch {
      dbConnected = false;
    }
  }

  // K8s probes only need status + HTTP code — no internal details
  const healthy = !dbConfigured || dbConnected;

  return withCache(
    NextResponse.json(
      { status: healthy ? "ok" : "degraded" },
      { status: healthy ? 200 : 503 },
    ),
    "none",
  );
}
