/**
 * Shared chart utilities used by KillCountChart and PlayerCountChart.
 *
 * Centralizes time-range definitions, formatting helpers, and data
 * processing functions so bug fixes and style changes apply once.
 */

/* ------------------------------------------------------------------ */
/*  Time range options                                                 */
/* ------------------------------------------------------------------ */

export const RANGES = [
  { label: "6H", hours: 6 },
  { label: "24H", hours: 24 },
  { label: "3D", hours: 72 },
  { label: "7D", hours: 168 },
  { label: "ALL", hours: 0 },
] as const;

export type RangeLabel = (typeof RANGES)[number]["label"];

export const DEFAULT_RANGE: RangeLabel = "24H";
export const MAX_CHART_POINTS = 300;

/* ------------------------------------------------------------------ */
/*  Base data point (charts extend this)                               */
/* ------------------------------------------------------------------ */

export interface BaseDataPoint {
  timestamp: string;
  ts: number;
  value: number;
  valueSmooth: number;
  label: string;
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

/** Check whether data spans more than one calendar day. */
export function spansMultipleDays(data: BaseDataPoint[]): boolean {
  if (data.length < 2) return false;
  const first = new Date(data[0].timestamp).toLocaleDateString();
  const last = new Date(data[data.length - 1].timestamp).toLocaleDateString();
  return first !== last;
}

/** Format a timestamp for the X-axis — short time or date+time. */
export function formatAxis(ts: string, multiDay: boolean): string {
  const d = new Date(ts);
  if (multiDay) {
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      hour12: true,
    });
  }
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format a timestamp for the tooltip — always includes date. */
export function formatTooltipTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Human-readable large number (e.g., 330.5M, 24.6K). */
export function formatCompact(n: number, decimals = 1): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`;
  return n.toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  Data processing                                                    */
/* ------------------------------------------------------------------ */

/** Downsample keeping first, last, and evenly-spaced middle points. */
export function downsample<T extends BaseDataPoint>(
  points: T[],
  maxPoints: number,
): T[] {
  if (points.length <= maxPoints) return points;
  const result: T[] = [points[0]];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 1; i < maxPoints - 1; i++) {
    result.push(points[Math.round(i * step)]);
  }
  result.push(points[points.length - 1]);
  return result;
}

/**
 * Gaussian smooth values in-place on the `valueSmooth` field.
 *
 * Uses a Gaussian kernel so nearby points contribute more than distant
 * ones. Good for player count and other noisy point-in-time signals.
 */
export function gaussianSmooth<T extends BaseDataPoint>(
  points: T[],
  window: number,
): T[] {
  const sigma = window / 2.5;
  const weights: number[] = [];
  for (let d = 0; d <= window; d++) {
    weights.push(Math.exp((-d * d) / (2 * sigma * sigma)));
  }

  return points.map((p, i) => {
    let weightedSum = p.value * weights[0];
    let totalWeight = weights[0];

    for (let offset = 1; offset <= window; offset++) {
      if (i - offset >= 0) {
        weightedSum += points[i - offset].value * weights[offset];
        totalWeight += weights[offset];
      }
      if (i + offset < points.length) {
        weightedSum += points[i + offset].value * weights[offset];
        totalWeight += weights[offset];
      }
    }

    return {
      ...p,
      valueSmooth: Math.round(weightedSum / totalWeight),
    };
  });
}

/**
 * Filter data points to a time range.
 *
 * Anchors the window to the **latest data point**, not `Date.now()`.
 * This makes ranges meaningful even when data is stale — "6H" means
 * the last 6 hours of data that exists, not the last 6 clock-hours.
 */
export function filterToRange<T extends BaseDataPoint>(
  allData: T[],
  range: RangeLabel,
): T[] {
  const cfg = RANGES.find((r) => r.label === range)!;
  if (cfg.hours === 0 || allData.length === 0) return allData;
  const latest = allData[allData.length - 1].ts;
  const cutoff = latest - cfg.hours * 3_600_000;
  return allData.filter((d) => d.ts >= cutoff);
}

/**
 * Determine which range buttons should be enabled.
 *
 * Anchored to the latest data point (same as `filterToRange`) so
 * ranges remain available even when upstream data is stale.
 */
export function computeAvailableRanges(
  allData: BaseDataPoint[],
): Set<RangeLabel> {
  if (allData.length === 0) return new Set<RangeLabel>();
  const latest = allData[allData.length - 1].ts;
  const set = new Set<RangeLabel>(["ALL"]);
  for (const r of RANGES) {
    if (r.hours === 0) continue;
    const cutoff = latest - r.hours * 3_600_000;
    const count = allData.filter((d) => d.ts >= cutoff).length;
    if (count >= 2) set.add(r.label);
  }
  return set;
}

/**
 * Clamp Y-axis domain to prevent negative values.
 *
 * Recharts `domain` supports functions: `[min => ..., max => ...]`.
 * This provides padding while ensuring the floor is never negative.
 */
export function clampedDomain(
  padding: number,
): [(min: number) => number, (max: number) => number] {
  return [
    (min: number) => Math.max(0, min - padding),
    (max: number) => max + padding,
  ];
}

import { THEME } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/*  Shared chart style tokens                                          */
/* ------------------------------------------------------------------ */

/** Tooltip content style matching the cryo design language. */
export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: THEME.bg,
    border: `1px solid ${THEME.border}`,
    borderRadius: 0,
    fontSize: 12,
    color: THEME.text,
  },
  labelStyle: {
    color: THEME.accent2,
    fontFamily: "var(--font-display)",
    fontSize: 11,
    letterSpacing: "1px",
  },
} as const;

/** Common axis styling. */
export const AXIS_STYLE = {
  stroke: THEME.dim,
  tick: { fontSize: 10, fill: THEME.dim },
  axisLine: { stroke: THEME.border },
  tickLine: { stroke: THEME.border },
} as const;

/** Grid styling. */
export const GRID_STYLE = {
  strokeDasharray: "3 3",
  stroke: THEME.border,
  strokeOpacity: 0.5,
} as const;
