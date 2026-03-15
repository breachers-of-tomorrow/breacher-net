import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * Next.js proxy — applies rate limiting to all /api/* routes.
 *
 * Runs at the edge of the Next.js server before route handlers.
 * Cloudflare provides edge-level rate limiting; this is the app-level backstop.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip health checks — K8s probes should never be rate-limited
  if (pathname === "/api/health") {
    return NextResponse.next();
  }

  // Extract client IP — Cloudflare/proxy sets x-forwarded-for
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "127.0.0.1";

  // Look up per-path config, fall back to default
  const config = RATE_LIMITS[pathname] ?? RATE_LIMITS.default;
  const result = checkRateLimit(ip, pathname, config);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Too many requests", retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        },
      },
    );
  }

  // Allowed — pass through with rate limit headers for observability
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
