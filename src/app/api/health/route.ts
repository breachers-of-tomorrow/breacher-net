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
  let dbHasData = false;

  if (dbConfigured) {
    try {
      dbHasData = await isDatabaseReady();
      dbConnected = true;
    } catch {
      dbConnected = false;
    }
  }

  const status = dbConfigured ? (dbConnected ? "healthy" : "degraded") : "standalone";

  return withCache(NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    database: {
      configured: dbConfigured,
      connected: dbConnected,
      has_data: dbHasData,
    },
    mode: dbHasData ? "database" : "live-api",
  }), "none");
}
