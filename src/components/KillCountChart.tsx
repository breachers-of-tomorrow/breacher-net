"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  timestamp: string;
  value: number;
  label: string;
}

interface HistoryRow {
  captured_at: string;
  kill_count: number;
}

function formatAxis(ts: string): string {
  const d = new Date(ts);
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

export function KillCountChart() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/state/history?limit=288");
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const json = await res.json();

        const rows: HistoryRow[] = json.data ?? [];
        if (rows.length === 0) {
          setError("No historical data yet");
          return;
        }

        // Sort oldest → newest
        const sorted = [...rows].sort(
          (a, b) =>
            new Date(a.captured_at).getTime() -
            new Date(b.captured_at).getTime(),
        );

        setData(
          sorted.map((r) => ({
            timestamp: r.captured_at,
            value: r.kill_count,
            label: formatTooltipTime(r.captured_at),
          })),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chart");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="cryo-panel p-5 h-[300px] flex items-center justify-center">
        <div className="font-[var(--font-display)] text-xs tracking-[4px] text-dim animate-blink">
          LOADING CHART DATA...
        </div>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="cryo-panel p-5 h-[300px] flex flex-col items-center justify-center gap-4">
        <div className="text-dim text-sm tracking-[2px]">
          {error ?? "NO DATA AVAILABLE"}
        </div>
        <a
          href="https://marathon.winnower.garden/cryoarchive"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent text-xs tracking-[2px] hover:glow-accent"
        >
          VIEW HISTORICAL DATA AT WINNOWER GARDEN →
        </a>
      </div>
    );
  }

  return (
    <div className="cryo-panel p-4 sm:p-5" role="img" aria-label="Kill count over time chart showing UESC kill count trends">
      <div className="h-[280px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
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
              tickFormatter={formatAxis}
              stroke="#5A7A8A"
              tick={{ fontSize: 10, fill: "#5A7A8A" }}
              axisLine={{ stroke: "#1A4660" }}
              tickLine={{ stroke: "#1A4660" }}
              interval="preserveStartEnd"
              minTickGap={60}
            />
            <YAxis
              tickFormatter={formatKills}
              stroke="#5A7A8A"
              tick={{ fontSize: 10, fill: "#5A7A8A" }}
              axisLine={{ stroke: "#1A4660" }}
              tickLine={{ stroke: "#1A4660" }}
              width={55}
              domain={["dataMin - 100000", "dataMax + 100000"]}
            />
            <Tooltip
              labelFormatter={(label) => formatTooltipTime(label as string)}
              formatter={(value) => [
                Number(value).toLocaleString(),
                "Kill Count",
              ]}
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
              type="monotone"
              dataKey="value"
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
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
