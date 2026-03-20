"use client";

import { useMemo, useState } from "react";
import { useKillCountData, useChartRange } from "@/hooks";
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

/**
 * KPM rolling-average window scales with the selected time range.
 * At 15-min poll intervals: 3 points = 45 min, 5 = 75 min, etc.
 */
function kpmWindowForRange(rangeLabel: RangeLabel): number {
  switch (rangeLabel) {
    case "6H":
      return 2;
    case "24H":
      return 3;
    case "3D":
      return 4;
    case "7D":
      return 5;
    case "ALL":
      return 6;
  }
}

function formatKills(n: number): string {
  return formatCompact(n, 1);
}

/* ------------------------------------------------------------------ */
/*  Data processing                                                    */
/* ------------------------------------------------------------------ */

/**
 * Compute KPM with a simple rolling average.
 *
 * Data arrives at 15-minute intervals directly from the poller.
 * No interpolation is needed — we just plot the raw values and
 * compute the rate between consecutive points where kill_count
 * actually changed (skipping flat segments where the game API
 * hadn't updated yet).
 *
 * The rolling average uses a centered window to smooth the rate
 * curve without introducing the overshoot artifacts that cubic
 * interpolation was causing.
 */
function computeKpm(points: DataPoint[], window: number): DataPoint[] {
  // First pass: compute raw KPM at each point from nearest change
  const rawKpm: (number | null)[] = points.map((p, i) => {
    if (i === 0) return null;
    // Walk backward to find last different value
    let prev = i - 1;
    while (prev >= 0 && points[prev].value === p.value) prev--;
    if (prev < 0) return null;

    const dk = p.value - points[prev].value;
    const dt = (p.ts - points[prev].ts) / 60_000;
    if (dt <= 0 || dk <= 0) return null;
    return dk / dt;
  });

  // Second pass: rolling average to smooth the rate curve
  return points.map((p, i) => {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - window); j <= Math.min(points.length - 1, i + window); j++) {
      if (rawKpm[j] !== null) {
        sum += rawKpm[j]!;
        count++;
      }
    }
    const kpm = count > 0 ? Math.round(sum / count) : null;
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
  const { deduped, loading, error } = useKillCountData();
  const [range, setRange] = useChartRange(externalRange, onRangeChange);
  const [showKpm, setShowKpm] = useState(true);

  /** Map deduplicated rows to chart DataPoints. */
  const allData = useMemo<DataPoint[]>(() => {
    if (deduped.length === 0) return [];
    return deduped.map((r, i) => {
      const killCount = Number(r.kill_count);
      let kpm: number | null = null;
      if (i > 0) {
        const prevKc = Number(deduped[i - 1].kill_count);
        const t1 = new Date(deduped[i - 1].captured_at).getTime();
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
  }, [deduped]);

  /** Filter → downsample → compute KPM. No interpolation — raw 15-min data. */
  const chartData = useMemo(() => {
    if (allData.length === 0) return [];
    const filtered = filterToRange(allData, range);
    const sampled = downsample(filtered, MAX_CHART_POINTS);
    return computeKpm(sampled, kpmWindowForRange(range));
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
              dataKey="value"
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
