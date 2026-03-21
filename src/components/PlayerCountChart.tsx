"use client";

import { useMemo } from "react";
import { useSteamPlayers } from "@/hooks";
import { THEME } from "@/lib/constants";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  gaussianSmooth,
  filterToRange,
  computeAvailableRanges,
  clampedDomain,
  TOOLTIP_STYLE,
  AXIS_STYLE,
  GRID_STYLE,
} from "@/lib/chart-utils";
import type { RangeLabel, BaseDataPoint } from "@/lib/chart-utils";

type DataPoint = BaseDataPoint;

function formatPlayers(n: number): string {
  return formatCompact(n, 1);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  /** Externally-controlled time range — syncs with KillCountChart */
  range: RangeLabel;
  onRangeChange: (range: RangeLabel) => void;
}

export function PlayerCountChart({ range, onRangeChange }: Props) {
  const { rows, loading, error } = useSteamPlayers();

  /** Map raw rows to chart DataPoints. */
  const allData = useMemo<DataPoint[]>(() => {
    if (rows.length === 0) return [];
    return rows.map((r) => ({
      timestamp: r.captured_at,
      ts: new Date(r.captured_at).getTime(),
      value: Number(r.player_count),
      valueSmooth: Number(r.player_count),
      label: formatTooltipTime(r.captured_at),
    }));
  }, [rows]);

  const chartData = useMemo(() => {
    if (allData.length === 0) return [];
    const filtered = filterToRange(allData, range);
    const sampled = downsample(filtered, MAX_CHART_POINTS);
    // Smooth window: fewer points for short ranges, more for long
    const window = range === "6H" ? 4 : range === "24H" ? 6 : 8;
    return gaussianSmooth(sampled, window);
  }, [allData, range]);

  const availableRanges = useMemo(
    () => computeAvailableRanges(allData),
    [allData],
  );

  /** Compute peak and trough for annotation */
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    let peak = chartData[0];
    let trough = chartData[0];
    for (const p of chartData) {
      if (p.valueSmooth > peak.valueSmooth) peak = p;
      if (p.valueSmooth < trough.valueSmooth) trough = p;
    }
    return { peak, trough, current: chartData[chartData.length - 1] };
  }, [chartData]);

  /* ---- Loading / error states ---- */

  if (loading) {
    return (
      <div className="cryo-panel p-5 h-[260px] flex items-center justify-center">
        <div className="font-[var(--font-display)] text-xs tracking-[4px] text-dim animate-blink">
          LOADING PLAYER DATA...
        </div>
      </div>
    );
  }

  if (error || allData.length === 0) {
    return (
      <div className="cryo-panel p-5 h-[260px] flex items-center justify-center">
        <div className="text-dim text-sm tracking-[2px]">
          {error ?? "NO PLAYER DATA AVAILABLE"}
        </div>
      </div>
    );
  }

  const multiDay = spansMultipleDays(chartData);

  return (
    <div
      className="cryo-panel p-4 sm:p-5"
      role="img"
      aria-label="Steam player count over time chart"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-4">
          <div className="font-[var(--font-display)] text-[0.65rem] tracking-[3px] text-dim">
            STEAM PLAYERS OVER TIME
          </div>
          {stats && (
            <div className="flex gap-4 text-[0.55rem]">
              <span className="text-mint">
                ▲ {formatPlayers(stats.peak.valueSmooth)}
              </span>
              <span className="text-dim">
                ▼ {formatPlayers(stats.trough.valueSmooth)}
              </span>
              <span className="text-accent2">
                NOW {formatPlayers(stats.current.valueSmooth)}
              </span>
            </div>
          )}
        </div>
        {/* Time range (synced with kill chart) */}
        <div className="flex gap-1">
          {RANGES.map((r) => {
            const ok = availableRanges.has(r.label);
            const on = range === r.label;
            return (
              <button
                key={r.label}
                onClick={() => ok && onRangeChange(r.label)}
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

      {/* Chart */}
      <div className="h-[220px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="playerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={THEME.mint} stopOpacity={0.25} />
                <stop offset="100%" stopColor={THEME.mint} stopOpacity={0.02} />
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
              tickFormatter={formatPlayers}
              {...AXIS_STYLE}
              width={50}
              domain={clampedDomain(1_000)}
            />
            <Tooltip
              labelFormatter={(label) => formatTooltipTime(label as string)}
              formatter={(value) => [
                `${Number(value).toLocaleString()} players`,
                "Online",
              ]}
              {...TOOLTIP_STYLE}
            />
            <Area
              type="monotone"
              dataKey="valueSmooth"
              name="Players"
              stroke={THEME.mint}
              strokeWidth={2}
              fill="url(#playerGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: THEME.mint,
                stroke: THEME.mint,
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
