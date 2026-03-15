import { NextResponse } from "next/server";

/**
 * API input validation utilities.
 *
 * Centralizes param parsing + validation so route handlers stay clean.
 * Returns either the validated value or a NextResponse error.
 */

/** Valid status filter values for index entries. */
const VALID_STATUSES = ["locked", "unlocked", "all"] as const;
type IndexStatus = (typeof VALID_STATUSES)[number];

/** Valid entry type filter values for index entries. */
const VALID_TYPES = ["IMAGE", "TEXT", "VIDEO", "AUDIO"] as const;
type IndexEntryType = (typeof VALID_TYPES)[number];

/**
 * Parse and validate a `limit` query param.
 *
 * Returns the clamped integer or a 400 NextResponse if invalid.
 */
export function parseLimit(
  raw: string | null,
  defaultValue: number,
  max: number,
): number | NextResponse {
  if (raw === null) return defaultValue;

  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return NextResponse.json(
      { error: `Invalid limit: "${raw}" — must be a positive integer` },
      { status: 400 },
    );
  }
  return Math.min(parsed, max);
}

/**
 * Parse and validate a `since` query param as an ISO 8601 date string.
 *
 * Returns the original string (valid) or a 400 NextResponse if malformed.
 */
export function parseSince(
  raw: string | null,
): string | null | NextResponse {
  if (raw === null) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json(
      {
        error: `Invalid since date: "${raw}" — must be a valid ISO 8601 date (e.g. 2025-01-01T00:00:00Z)`,
      },
      { status: 400 },
    );
  }
  return raw;
}

/**
 * Validate an index `status` filter param.
 *
 * Returns the validated status or a 400 NextResponse.
 */
export function parseIndexStatus(
  raw: string | null,
): IndexStatus | NextResponse {
  const value = (raw ?? "all").toLowerCase();
  if (!VALID_STATUSES.includes(value as IndexStatus)) {
    return NextResponse.json(
      {
        error: `Invalid status: "${raw}" — must be one of: ${VALID_STATUSES.join(", ")}`,
      },
      { status: 400 },
    );
  }
  return value as IndexStatus;
}

/**
 * Validate an index `type` filter param.
 *
 * Returns the validated type, null (no filter), or a 400 NextResponse.
 */
export function parseIndexType(
  raw: string | null,
): IndexEntryType | null | NextResponse {
  if (raw === null) return null;

  const value = raw.toUpperCase();
  if (!VALID_TYPES.includes(value as IndexEntryType)) {
    return NextResponse.json(
      {
        error: `Invalid type: "${raw}" — must be one of: ${VALID_TYPES.join(", ")}`,
      },
      { status: 400 },
    );
  }
  return value as IndexEntryType;
}

/**
 * Type guard — returns true if the value is an error response.
 */
export function isErrorResponse(
  value: unknown,
): value is NextResponse {
  return value instanceof NextResponse;
}
