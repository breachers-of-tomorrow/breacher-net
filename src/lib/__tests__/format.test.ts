import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  toLocal,
  toLocalTimeOnly,
  toUTCTimeOnly,
  formatShipCountdown,
  timeAgo,
  formatCountdown,
  formatNumber,
  formatMillions,
  computeProgress,
} from "@/lib/format";

// ── Null / invalid input handling ─────────────────────────────────

describe("toLocal", () => {
  it("returns '--' for null", () => {
    expect(toLocal(null)).toBe("--");
  });

  it("returns '--' for invalid date string", () => {
    expect(toLocal("not-a-date")).toBe("--");
  });

  it("formats a valid Date object", () => {
    const d = new Date("2026-03-15T20:45:12Z");
    const result = toLocal(d);
    // Should contain time parts — exact format depends on locale
    expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });

  it("accepts an ISO string", () => {
    const result = toLocal("2026-01-01T00:00:00Z");
    expect(result).not.toBe("--");
    expect(result).toMatch(/\d/);
  });
});

describe("toLocalTimeOnly", () => {
  it("returns '--' for null", () => {
    expect(toLocalTimeOnly(null)).toBe("--");
  });

  it("returns '--' for invalid date", () => {
    expect(toLocalTimeOnly("garbage")).toBe("--");
  });

  it("formats valid date to time only", () => {
    const result = toLocalTimeOnly(new Date("2026-06-15T14:30:00Z"));
    expect(result).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    // Should NOT contain month/day
    expect(result).not.toMatch(/Jun|June|6/);
  });
});

describe("toUTCTimeOnly", () => {
  it("returns '--' for null", () => {
    expect(toUTCTimeOnly(null)).toBe("--");
  });

  it("returns '--' for invalid date", () => {
    expect(toUTCTimeOnly("nope")).toBe("--");
  });

  it("formats valid date to UTC time with UTC suffix", () => {
    const result = toUTCTimeOnly(new Date("2026-03-15T14:30:00Z"));
    expect(result).toContain("UTC");
    expect(result).toMatch(/2:30:00\s*PM\s*UTC/);
  });
});

// ── Countdown / relative time ─────────────────────────────────────

describe("formatShipCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'ARRIVED' if target is in the past", () => {
    vi.setSystemTime(new Date("2026-03-15T00:00:00Z"));
    expect(formatShipCountdown(new Date("2025-01-01T00:00:00Z"))).toBe(
      "ARRIVED",
    );
  });

  it("formats a future date with years, days, hours, minutes, seconds", () => {
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    // ~2 years from now
    const target = new Date("2028-06-15T12:30:45Z");
    const result = formatShipCountdown(target);
    expect(result).toMatch(/\d+y/);
    expect(result).toMatch(/\d+d/);
    expect(result).toMatch(/\d{2}h/);
    expect(result).toMatch(/\d{2}m/);
    expect(result).toMatch(/\d{2}s/);
  });

  it("omits years when less than a year away", () => {
    vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
    const target = new Date("2026-09-01T00:00:00Z");
    const result = formatShipCountdown(target);
    expect(result).not.toMatch(/\d+y/);
    expect(result).toMatch(/\d+d/);
  });
});

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for < 5 seconds", () => {
    const d = new Date("2026-03-15T11:59:57Z"); // 3s ago
    expect(timeAgo(d)).toBe("just now");
  });

  it("returns seconds for < 60s", () => {
    const d = new Date("2026-03-15T11:59:30Z"); // 30s ago
    expect(timeAgo(d)).toBe("30s ago");
  });

  it("returns minutes for < 60m", () => {
    const d = new Date("2026-03-15T11:45:00Z"); // 15m ago
    expect(timeAgo(d)).toBe("15m ago");
  });

  it("returns hours and minutes for >= 60m", () => {
    const d = new Date("2026-03-15T09:45:00Z"); // 2h 15m ago
    expect(timeAgo(d)).toBe("2h 15m ago");
  });
});

describe("formatCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'UPDATING...' when target is in the past", () => {
    expect(formatCountdown(new Date("2026-03-15T11:59:00Z"))).toBe(
      "UPDATING...",
    );
  });

  it("formats remaining time", () => {
    const target = new Date("2026-03-15T12:03:45Z"); // 3m 45s from now
    expect(formatCountdown(target)).toBe("IN 3m 45s");
  });
});

// ── Number formatting ─────────────────────────────────────────────

describe("formatNumber", () => {
  it("formats with commas", () => {
    expect(formatNumber(187450082)).toBe("187,450,082");
  });

  it("handles small numbers", () => {
    expect(formatNumber(42)).toBe("42");
  });

  it("handles zero", () => {
    expect(formatNumber(0)).toBe("0");
  });
});

describe("formatMillions", () => {
  it("formats millions", () => {
    expect(formatMillions(187_000_000)).toBe("187M");
  });

  it("rounds down", () => {
    expect(formatMillions(187_499_999)).toBe("187M");
  });
});

// ── Progress computation ──────────────────────────────────────────

describe("computeProgress", () => {
  it("returns 0 at the start", () => {
    const start = new Date("2026-01-01");
    const end = new Date("2026-12-31");
    expect(computeProgress(start, end, new Date("2026-01-01"))).toBe(0);
  });

  it("returns ~50 at midpoint", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const end = new Date("2026-01-03T00:00:00Z");
    const mid = new Date("2026-01-02T00:00:00Z");
    expect(computeProgress(start, end, mid)).toBeCloseTo(50, 0);
  });

  it("clamps to 100 when past end", () => {
    const start = new Date("2026-01-01");
    const end = new Date("2026-01-02");
    expect(computeProgress(start, end, new Date("2027-01-01"))).toBe(100);
  });

  it("returns 100 when start === end", () => {
    const d = new Date("2026-01-01");
    expect(computeProgress(d, d)).toBe(100);
  });
});
