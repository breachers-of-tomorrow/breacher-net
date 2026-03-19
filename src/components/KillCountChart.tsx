"use client";

import { useEffect, useMemo, useState } from "react";
import { URLS } from "@/lib/urls";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  RANGES,
  DEFAULT_RANGE,
  MAX_CHART_POINTS,
  spansMultipleDays,
  formatAxis,
  formatTooltipTime,
  formatCompact,
  downsample,
  filterToRange,
  computeAvailableRanges,
  clampedDomain,
  TOOLTIP_STYLE,
  AXIS_STYLE,
  GRID_STYLE,
} from "@/lib/chart-utils";
import type { RangeLabel, BaseDataPoint } from "@/lib/chart-utils";

interface DataPoint extends BaseDataPoint {
  kpm: number | null;
  kpmSmooth: number | null;
}

interface HistoryRow {
  captured_at: string;
  kill_count: string | number;
}

/**
 * Smoothing window size scales with the selected time range.
 * Shorter ranges show more detail; longer ranges smooth more aggressively.
 */
function kpmWindowForRange(rangeLabel: RangeLabel): number {
  switch (rangeLabel) {
    case "6H":
      return 8;
    case "24H":
      return 12;
    case "3D":
      return 16;
    case "7D":
      return 20;
    case "ALL":
      return 24;
  }
}

function formatKills(n: number): string {
  return formatCompact(n, 1);
}

/* ------------------------------------------------------------------ */
/*  Data processing                                                    */
/* ------------------------------------------------------------------ */

/**
 * Monotone cubic interpolation (Fritsch-Carlson) between change points.
 *
 * The poller returns identical kill_count between game API updates,
 * creating staircase steps. Linear interpolation creates sharp kinks
 * at change points, which propagate as spikes in the derivative (KPM).
 *
 * Cubic interpolation produces C1-continuous curves (smooth first
 * derivative), eliminating the KPM spikes entirely.
 */
function interpolateKillCount(points: DataPoint[]): DataPoint[] {
  if (points.length < 2) return points.map((p) => ({ ...p }));

  // Collect indices where the kill count actually changed
  const cpIdx: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    if (points[i].value !== points[i - 1].value) cpIdx.push(i);
  }
  if (cpIdx[cpIdx.length - 1] !== points.length - 1) {
    cpIdx.push(points.length - 1);
  }

  // If fewer than 3 change points, fall back to linear
  if (cpIdx.length < 3) {
    return linearInterpolate(points, cpIdx);
  }

  // Build arrays for the spline knots
  const n = cpIdx.length;
  const xs = cpIdx.map((i) => points[i].ts);
  const ys = cpIdx.map((i) => points[i].value);

  // Compute slopes between knots
  const deltas: number[] = [];
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    deltas.push(dx);
    slopes.push(dx > 0 ? (ys[i + 1] - ys[i]) / dx : 0);
  }

  // Fritsch-Carlson tangents: monotone-preserving
  const tangents = new Array(n).fill(0);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];

  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      tangents[i] = 0;
    } else {
      tangents[i] =
        (2 * slopes[i - 1] * slopes[i]) / (slopes[i - 1] + slopes[i]);
    }
  }

  // Evaluate cubic hermite for every point
  const result = points.map((p) => ({ ...p }));

  for (let seg = 0; seg < n - 1; seg++) {
    const x0 = xs[seg];
    const x1 = xs[seg + 1];
    const y0 = ys[seg];
    const y1 = ys[seg + 1];
    const m0 = tangents[seg] * (x1 - x0);
    const m1 = tangents[seg + 1] * (x1 - x0);

    const startIdx = cpIdx[seg];
    const endIdx = cpIdx[seg + 1];

    for (let i = startIdx; i <= endIdx; i++) {
      const t = x1 !== x0 ? (points[i].ts - x0) / (x1 - x0) : 0;
      const t2 = t * t;
      const t3 = t2 * t;

      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;

      result[i].valueSmooth = Math.round(
        h00 * y0 + h10 * m0 + h01 * y1 + h11 * m1,
      );
    }
  }

  return result;
}

/** Simple linear interpolation fallback. */
function linearInterpolate(
  points: DataPoint[],
  cpIdx: number[],
): DataPoint[] {
  const result = points.map((p) => ({ ...p }));

  for (let c = 0; c < cpIdx.length - 1; c++) {
    const si = cpIdx[c];
    const ei = cpIdx[c + 1];
    const sv = points[si].value;
    const ev = points[ei].value;
    const st = points[si].ts;
    const dt = points[ei].ts - st;

    for (let i = si; i <= ei; i++) {
      const t = dt > 0 ? (points[i].ts - st) / dt : 0;
      result[i].valueSmooth = Math.round(sv + (ev - sv) * t);
    }
  }

  return result;
}

/**
 * Gaussian-weighted KPM smoothing.
 *
 * Instead of a simple central-difference over a fixed window,
 * this applies a Gaussian kernel so nearby points contribute
 * more than distant ones. The result is a much smoother rate
 * curve with no abrupt transitions.
 */
function computeSmoothedKpm(
  points: DataPoint[],
  window: number,
): DataPoint[] {
  const sigma = window / 2.5;
  const weights: number[] = [];
  for (let d = 0; d <= window; d++) {
    weights.push(Math.exp((-d * d) / (2 * sigma * sigma)));
  }

  return points.map((p, i) => {
    let weightedRate = 0;
    let totalWeight = 0;

    for (let offset = 1; offset <= window; offset++) {
      const lo = i - offset;
      const hi = i + offset;
      if (lo < 0 || hi >= points.length) continue;

      const dv = points[hi].valueSmooth - points[lo].valueSmooth;
      const dt = (points[hi].ts - points[lo].ts) / 60_000;
      if (dt <= 0) continue;

      const w = weights[offset];
      weightedRate += (dv / dt) * w;
      totalWeight += w;
    }

    const kpm =
      totalWeight > 0 ? Math.round(weightedRate / totalWeight) : null;
    return {
      ...p,
      kpmSmooth: kpm !== null && kpm > 0 ? kpm : null,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  /** Externally-controlled time range — syncs with PlayerCountChart */
  range?: RangeLabel;
  onRangeChange?: (range: RangeLabel) => void;
}

export function KillCountChart({ range: externalRange, onRangeChange }: Props = {}) {
  const [allData, setAllData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalRange, setInternalRange] = useState<RangeLabel>(DEFAULT_RANGE);
  const [showKpm, setShowKpm] = useState(true);

  const range = externalRange ?? internalRange;
  const setRange = onRangeChange ?? setInternalRange;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/state/history?limit=1000");
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const json = await res.json();

        const rows: HistoryRow[] = json.data ?? [];
        if (rows.length === 0) {
          setError("No historical data yet");
          return;
        }

        const sorted = [...rows].sort(
          (a, b) =>
            new Date(a.captured_at).getTime() -
            new Date(b.captured_at).getTime(),
        );

        const points: DataPoint[] = sorted.map((r, i) => {
          // PostgreSQL BIGINT comes back as string — must coerce to number
          const killCount = Number(r.kill_count);
          let kpm: number | null = null;
          if (i > 0) {
            const prevKc = Number(sorted[i - 1].kill_count);
            const t1 = new Date(sorted[i - 1].captured_at).getTime();
            const t2 = new Date(r.captured_at).getTime();
            const mins = (t2 - t1) / 60_000;
            if (mins > 0 && killCount > prevKc) {
              kpm = Math.round((killCount - prevKc) / mins);
            }
          }
          return {
            timestamp: r.captured_at,
            ts: new Date(r.captured_at).getTime(),
            value: killCount,
            valueSmooth: killCount,
            kpm,
            kpmSmooth: null,
            label: formatTooltipTime(r.captured_at),
          };
        });

        setAllData(points);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chart");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /** Filter → downsample → smooth, recomputed when range or data changes. */
  const chartData = useMemo(() => {
    if (allData.length === 0) return [];
    const filtered = filterToRange(allData, range);
    const sampled = downsample(filtered, MAX_CHART_POINTS);
    const interpolated = interpolateKillCount(sampled);
    return computeSmoothedKpm(interpolated, kpmWindowForRange(range));
  }, [allData, range]);

  /** Only enable range buttons when we actually have enough data. */
  const availableRanges = useMemo(
    () => computeAvailableRanges(allData),
    [allData],
  );

  /* ---- Loading / error states ---- */

  if (loading) {
    return (
      <div className="cryo-panel p-5 h-[300px] flex items-center justify-center">
        <div className="font-[var(--font-display)] text-xs tracking-[4px] text-dim animate-blink">
          LOADING CHART DATA...
        </div>
      </div>
    );
  }

  if (error || allData.length === 0) {
    return (
      <div className="cryo-panel p-5 h-[300px] flex flex-col items-center justify-center gap-4">
        <div className="text-dim text-sm tracking-[2px]">
          {error ?? "NO DATA AVAILABLE"}
        </div>
        <a
          href={URLS.winnower}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent text-xs tracking-[2px] hover:glow-accent"
        >
          VIEW HISTORICAL DATA AT WINNOWER GARDEN →
        </a>
      </div>
    );
  }

  /* ---- Render ---- */

  const multiDay = spansMultipleDays(chartData);
  const hasKpm =
    showKpm && chartData.some((d) => d.kpmSmooth !== null && d.kpmSmooth! > 0);

  return (
    <div
      className="cryo-panel p-4 sm:p-5"
      role="img"
      aria-label="Kill count over time chart"
    >
      {/* Header bar: title + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="font-[var(--font-display)] text-[0.65rem] tracking-[3px] text-dim">
          KILL COUNT OVER TIME
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* KPM toggle */}
          <button
            onClick={() => setShowKpm((v) => !v)}
            className={`font-[var(--font-display)] text-[0.55rem] tracking-[2px] px-2 py-1 border transition-colors ${showKpm
                ? "border-orange-500/50 text-orange-400 bg-orange-500/10"
                : "border-border text-dim hover:text-text-body"
              }`}
            title={showKpm ? "Hide kills/min rate" : "Show kills/min rate"}
            aria-pressed={showKpm}
          >
            KILLS/MIN
          </button>
          {/* Time range */}
          <div className="flex gap-1">
            {RANGES.map((r) => {
              const ok = availableRanges.has(r.label);
              const on = range === r.label;
              return (
                <button
                  key={r.label}
                  onClick={() => ok && setRange(r.label)}
                  disabled={!ok}
                  className={`font-[var(--font-display)] text-[0.55rem] tracking-[1px] px-2 py-1 border transition-colors ${on
                      ? "border-accent text-accent bg-accent/10"
                      : ok
                        ? "border-border text-dim hover:text-text-body hover:border-border"
                        : "border-border/50 text-dim/30 cursor-not-allowed"
                    }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px] sm:h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: hasKpm ? 50 : 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="killGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF3344" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FF3344" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(ts) => formatAxis(ts, multiDay)}
              {...AXIS_STYLE}
              interval="preserveStartEnd"
              minTickGap={multiDay ? 80 : 60}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatKills}
              {...AXIS_STYLE}
              width={55}
              domain={clampedDomain(100_000)}
            />
            {hasKpm && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => `${v}`}
                stroke={AXIS_STYLE.stroke}
                tick={{ fontSize: 10, fill: "#FF6B35" }}
                axisLine={AXIS_STYLE.axisLine}
                tickLine={AXIS_STYLE.tickLine}
                width={40}
                domain={clampedDomain(50)}
              />
            )}
            <Tooltip
              labelFormatter={(label) => formatTooltipTime(label as string)}
              formatter={(value, name, props) => {
                if (name === "Kill Count") {
                  const raw = props?.payload?.value ?? Number(value);
                  return [Number(raw).toLocaleString(), "Kill Count"];
                }
                if (name === "Kills/min")
                  return [
                    `${Number(value).toLocaleString()} kills/min`,
                    "Rate",
                  ];
                return [String(value), String(name)];
              }}
              {...TOOLTIP_STYLE}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="valueSmooth"
              name="Kill Count"
              stroke="#FF3344"
              strokeWidth={2}
              fill="url(#killGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#FF3344",
                stroke: "#FF3344",
                strokeWidth: 2,
              }}
            />
            {hasKpm && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="kpmSmooth"
                name="Kills/min"
                stroke="#FF6B35"
                strokeWidth={1.5}
                strokeOpacity={0.7}
                dot={false}
                activeDot={{ r: 3, fill: "#FF6B35", stroke: "#FF6B35" }}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
