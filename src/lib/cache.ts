import { NextResponse } from "next/server";

/**
 * Cache-Control header presets for API routes.
 *
 * All durations assume the Python poller writes new data every 15 minutes.
 * Cloudflare at the edge respects these origin headers for smarter caching.
 */

type CachePreset = "realtime" | "standard" | "slow" | "static" | "none";

const PRESETS: Record<CachePreset, string> = {
  /** Frequently polled data — cache briefly, allow stale. */
  realtime: "public, max-age=60, stale-while-revalidate=30",

  /** Standard history endpoints — slightly longer cache. */
  standard: "public, max-age=120, stale-while-revalidate=60",

  /** Infrequently changing data — generous cache. */
  slow: "public, max-age=300, stale-while-revalidate=120",

  /** Never changes (or changes on deploy). */
  static: "public, max-age=3600, stale-while-revalidate=600",

  /** Must always be fresh (health checks). */
  none: "no-cache, no-store, must-revalidate",
};

/**
 * Apply Cache-Control header to a NextResponse.
 *
 * Mutates the response in-place and returns it for chaining.
 */
export function withCache(
  response: NextResponse,
  preset: CachePreset,
): NextResponse {
  response.headers.set("Cache-Control", PRESETS[preset]);
  return response;
}
