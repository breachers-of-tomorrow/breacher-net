/**
 * Simple in-memory rate limiter using a sliding window counter.
 *
 * This is the app-level backstop — Cloudflare handles edge rate limiting.
 * Protects against:
 * - Direct origin access bypassing Cloudflare
 * - Internal abuse or runaway scripts
 * - Expensive upstream proxy endpoints
 *
 * NOT suitable for multi-instance deployments (each pod has its own state).
 * For a single-replica Next.js standalone server, this is fine.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/** Per-path rate limit configuration. */
interface RateLimitConfig {
  /** Max requests allowed in the window. */
  limit: number;
  /** Window duration in seconds. */
  windowSeconds: number;
}

/** In-memory store keyed by "ip:path". */
const store = new Map<string, RateLimitEntry>();

/** Cleanup stale entries every 60 seconds to prevent memory leaks. */
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Check if a request should be rate-limited.
 *
 * Returns `{ allowed, remaining, resetAt }`.
 */
export function checkRateLimit(
  ip: string,
  path: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number; limit: number } {
  cleanup();

  const key = `${ip}:${path}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const entry = store.get(key);

  // No entry or expired window — create fresh
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt, limit: config.limit };
  }

  // Within window — increment
  entry.count++;
  const remaining = Math.max(0, config.limit - entry.count);
  const allowed = entry.count <= config.limit;

  return { allowed, remaining, resetAt: entry.resetAt, limit: config.limit };
}

/**
 * Per-path rate limit configs.
 *
 * More restrictive for expensive endpoints, generous for standard reads.
 * Unmatched paths fall through to the default.
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  /** Standard DB-query endpoints — generous limit. */
  default: { limit: 60, windowSeconds: 60 },
};
