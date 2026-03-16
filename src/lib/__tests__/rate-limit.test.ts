import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const config = { limit: 3, windowSeconds: 60 };

  it("allows the first request", () => {
    const result = checkRateLimit("1.2.3.4", "/api/test", config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.limit).toBe(3);
  });

  it("decrements remaining on each request", () => {
    checkRateLimit("10.0.0.1", "/api/foo", config);
    const r2 = checkRateLimit("10.0.0.1", "/api/foo", config);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit("10.0.0.1", "/api/foo", config);
    expect(r3.remaining).toBe(0);
    expect(r3.allowed).toBe(true);
  });

  it("blocks after limit is exceeded", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("10.0.0.2", "/api/bar", config);
    }
    const blocked = checkRateLimit("10.0.0.2", "/api/bar", config);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("10.0.0.3", "/api/baz", config);
    }

    // Advance past the 60s window
    vi.advanceTimersByTime(61_000);

    const afterReset = checkRateLimit("10.0.0.3", "/api/baz", config);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(2);
  });

  it("tracks different IPs independently", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("10.0.0.4", "/api/path", config);
    }

    // Different IP should be fresh
    const fresh = checkRateLimit("10.0.0.5", "/api/path", config);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(2);
  });

  it("tracks different paths independently", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("10.0.0.6", "/api/a", config);
    }

    // Different path should be fresh
    const fresh = checkRateLimit("10.0.0.6", "/api/b", config);
    expect(fresh.allowed).toBe(true);
    expect(fresh.remaining).toBe(2);
  });
});
