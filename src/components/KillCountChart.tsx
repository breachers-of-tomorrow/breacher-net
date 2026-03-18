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

interface DataPoint {
  timestamp: string;
  ts: number;
  value: number;
  valueSmooth: number;
  kpm: number | null;
  kpmSmooth: number | null;
  label: string;
}

interface HistoryRow {
  captured_at: string;
  kill_count: number;
}

/* ------------------------------------------------------------------ */
/*  Time range options                                                 */
/* ------------------------------------------------------------------ */

const RANGES = [
  { label: "6H", hours: 6 },
  { label: "24H", hours: 24 },
  { label: "3D", hours: 72 },
  { label: "7D", hours: 168 },
  { label: "ALL", hours: 0 },
] as const;

type RangeLabel = (typeof RANGES)[number]["label"];

const DEFAULT_RANGE: RangeLabel = "24H";
const MAX_CHART_POINTS = 300;
const KPM_SMOOTH_WINDOW = 5;
const KILL_SMOOTH_WINDOW = 7;

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

function spansMultipleDays(data: DataPoint[]): boolean {
  if (data.length < 2) return false;
  const first = new Date(data[0].timestamp).toLocaleDateString();
  const last = new Date(data[data.length - 1].timestamp).toLocaleDateString();
  return first !== last;
}

function formatAxis(ts: string, multiDay: boolean): string {
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

function formatTooltipTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatKills(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  Data processing                                                    */
/* ------------------------------------------------------------------ */

/** Downsample keeping first, last, and evenly-spaced middle points. */
function downsample(points: DataPoint[], maxPoints: number): DataPoint[] {
  if (points.length <= maxPoints) return points;
  const result: DataPoint[] = [points[0]];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 1; i < maxPoints - 1; i++) {
    result.push(points[Math.round(i * step)]);
  }
  result.push(points[points.length - 1]);
  return result;
}

/** Simple moving-average smoothing for KPM. */
function smoothKpm(points: DataPoint[], window: number): DataPoint[] {
  return points.map((p, i) => {
    if (p.kpm === null) return p;
    const half = Math.floor(window / 2);
    const start = Math.max(0, i - half);
    const end = Math.min(points.length, i + half + 1);
    const values: number[] = [];
    for (let j = start; j < end; j++) {
      if (points[j].kpm !== null) values.push(points[j].kpm!);
    }
    const avg =
      values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : null;
    return { ...p, kpmSmooth: avg };
  });
}

/** Moving-average smoothing for kill count to remove staircase steps. */
function smoothKillCount(points: DataPoint[], window: number): DataPoint[] {
  return points.map((p, i) => {
    const half = Math.floor(window / 2);
    const start = Math.max(0, i - half);
    const end = Math.min(points.length, i + half + 1);
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j++) {
      sum += points[j].value;
      count++;
    }
    return { ...p, valueSmooth: Math.round(sum / count) };
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function KillCountChart() {
  const [allData, setAllData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeLabel>(DEFAULT_RANGE);
  const [showKpm, setShowKpm] = useState(true);

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
          let kpm: number | null = null;
          if (i > 0) {
            const prev = sorted[i - 1];
            const t1 = new Date(prev.captured_at).getTime();
            const t2 = new Date(r.captured_at).getTime();
            const mins = (t2 - t1) / 60_000;
            if (mins > 0 && r.kill_count > prev.kill_count) {
              kpm = Math.round((r.kill_count - prev.kill_count) / mins);
            }
          }
          return {
            timestamp: r.captured_at,
            ts: new Date(r.captured_at).getTime(),
            value: r.kill_count,
            valueSmooth: r.kill_count,
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
    const cfg = RANGES.find((r) => r.label === range)!;
    let filtered: DataPoint[];
    if (cfg.hours === 0) {
      filtered = allData;
    } else {
      const cutoff = Date.now() - cfg.hours * 3_600_000;
      filtered = allData.filter((d) => d.ts >= cutoff);
      if (filtered.length < 2) filtered = allData;
    }
    const sampled = downsample(filtered, MAX_CHART_POINTS);
    return smoothKpm(smoothKillCount(sampled, KILL_SMOOTH_WINDOW), KPM_SMOOTH_WINDOW);
  }, [allData, range]);

  /** Only enable range buttons when we actually have enough data. */
  const availableRanges = useMemo(() => {
    if (allData.length === 0) return new Set<RangeLabel>();
    const hoursAvail = (Date.now() - allData[0].ts) / 3_600_000;
    const set = new Set<RangeLabel>(["ALL"]);
    for (const r of RANGES) {
      if (r.hours === 0 || hoursAvail >= r.hours * 0.5) set.add(r.label);
    }
    return set;
  }, [allData]);

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
            className={`font-[var(--font-display)] text-[0.55rem] tracking-[2px] px-2 py-1 border transition-colors ${
              showKpm
                ? "border-orange-500/50 text-orange-400 bg-orange-500/10"
                : "border-border text-dim hover:text-text-body"
            }`}
            title={showKpm ? "Hide kills/min rate" : "Show kills/min rate"}
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
                  className={`font-[var(--font-display)] text-[0.55rem] tracking-[1px] px-2 py-1 border transition-colors ${
                    on
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
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1A4660"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(ts) => formatAxis(ts, multiDay)}
              stroke="#5A7A8A"
              tick={{ fontSize: 10, fill: "#5A7A8A" }}
              axisLine={{ stroke: "#1A4660" }}
              tickLine={{ stroke: "#1A4660" }}
              interval="preserveStartEnd"
              minTickGap={multiDay ? 80 : 60}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatKills}
              stroke="#5A7A8A"
              tick={{ fontSize: 10, fill: "#5A7A8A" }}
              axisLine={{ stroke: "#1A4660" }}
              tickLine={{ stroke: "#1A4660" }}
              width={55}
              domain={["dataMin - 100000", "dataMax + 100000"]}
            />
            {hasKpm && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v) => `${v}`}
                stroke="#5A7A8A"
                tick={{ fontSize: 10, fill: "#FF6B35" }}
                axisLine={{ stroke: "#1A4660" }}
                tickLine={{ stroke: "#1A4660" }}
                width={40}
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
              contentStyle={{
                backgroundColor: "#0A2A35",
                border: "1px solid #1A4660",
                borderRadius: 0,
                fontSize: 12,
                color: "#8AACB8",
              }}
              labelStyle={{
                color: "#00D4EB",
                fontFamily: "var(--font-display)",
                fontSize: 11,
                letterSpacing: "1px",
              }}
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
