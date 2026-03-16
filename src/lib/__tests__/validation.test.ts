import { describe, it, expect } from "vitest";
import {
  parseLimit,
  parseSince,
  parseIndexStatus,
  parseIndexType,
  isErrorResponse,
} from "@/lib/validation";
import { NextResponse } from "next/server";

// Helper: extract JSON body from a NextResponse error
async function errorBody(resp: NextResponse): Promise<{ error: string }> {
  return resp.json();
}

// ── parseLimit ────────────────────────────────────────────────────

describe("parseLimit", () => {
  it("returns default when raw is null", () => {
    expect(parseLimit(null, 50, 100)).toBe(50);
  });

  it("parses a valid integer", () => {
    expect(parseLimit("25", 50, 100)).toBe(25);
  });

  it("clamps to max", () => {
    expect(parseLimit("500", 50, 100)).toBe(100);
  });

  it("returns error for non-numeric", () => {
    const result = parseLimit("abc", 50, 100);
    expect(result).toBeInstanceOf(NextResponse);
  });

  it("returns error for zero", () => {
    const result = parseLimit("0", 50, 100);
    expect(result).toBeInstanceOf(NextResponse);
  });

  it("returns error for negative", () => {
    const result = parseLimit("-5", 50, 100);
    expect(result).toBeInstanceOf(NextResponse);
  });

  it("error includes descriptive message", async () => {
    const result = parseLimit("xyz", 50, 100) as NextResponse;
    const body = await errorBody(result);
    expect(body.error).toContain("xyz");
    expect(body.error).toContain("positive integer");
  });
});

// ── parseSince ────────────────────────────────────────────────────

describe("parseSince", () => {
  it("returns null when raw is null", () => {
    expect(parseSince(null)).toBeNull();
  });

  it("returns the string for a valid ISO date", () => {
    const iso = "2026-03-15T00:00:00Z";
    expect(parseSince(iso)).toBe(iso);
  });

  it("returns error for invalid date string", () => {
    const result = parseSince("not-a-date");
    expect(result).toBeInstanceOf(NextResponse);
  });

  it("error message includes the bad input", async () => {
    const result = parseSince("yesterday") as NextResponse;
    const body = await errorBody(result);
    expect(body.error).toContain("yesterday");
  });
});

// ── parseIndexStatus ──────────────────────────────────────────────

describe("parseIndexStatus", () => {
  it("defaults to 'all' when null", () => {
    expect(parseIndexStatus(null)).toBe("all");
  });

  it("accepts 'locked'", () => {
    expect(parseIndexStatus("locked")).toBe("locked");
  });

  it("accepts 'unlocked'", () => {
    expect(parseIndexStatus("unlocked")).toBe("unlocked");
  });

  it("is case-insensitive", () => {
    expect(parseIndexStatus("LOCKED")).toBe("locked");
    expect(parseIndexStatus("Unlocked")).toBe("unlocked");
  });

  it("returns error for invalid status", () => {
    const result = parseIndexStatus("maybe");
    expect(result).toBeInstanceOf(NextResponse);
  });
});

// ── parseIndexType ────────────────────────────────────────────────

describe("parseIndexType", () => {
  it("returns null when raw is null (no filter)", () => {
    expect(parseIndexType(null)).toBeNull();
  });

  it("accepts valid types", () => {
    expect(parseIndexType("IMAGE")).toBe("IMAGE");
    expect(parseIndexType("TEXT")).toBe("TEXT");
    expect(parseIndexType("VIDEO")).toBe("VIDEO");
    expect(parseIndexType("AUDIO")).toBe("AUDIO");
  });

  it("is case-insensitive", () => {
    expect(parseIndexType("image")).toBe("IMAGE");
    expect(parseIndexType("text")).toBe("TEXT");
  });

  it("returns error for invalid type", () => {
    const result = parseIndexType("PDF");
    expect(result).toBeInstanceOf(NextResponse);
  });
});

// ── isErrorResponse ───────────────────────────────────────────────

describe("isErrorResponse", () => {
  it("returns true for NextResponse", () => {
    const resp = NextResponse.json({ error: "bad" }, { status: 400 });
    expect(isErrorResponse(resp)).toBe(true);
  });

  it("returns false for a string", () => {
    expect(isErrorResponse("hello")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isErrorResponse(42)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isErrorResponse(null)).toBe(false);
  });
});
