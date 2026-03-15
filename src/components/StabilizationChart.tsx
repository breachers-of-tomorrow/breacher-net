"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface DataPoint {
  timestamp: string;
  [camera: string]: string | number;
}

interface StabRow {
  captured_at: string;
  cameras: Record<string, { stabilizationLevel: number }>;
}

// Theme-consistent colors per camera — all meet WCAG AA on dark bg
const CAMERA_COLORS: Record<string, string> = {
  cargo: "#FF3344",
  index: "#038ADF",
  revival: "#00D4EB",
  biostock: "#00FF9D",
  steerage: "#FFAA00",
  preservation: "#E0DDD2",
  cryoHub: "#FF6B9D",
  camera06: "#9D7AFF",
  camera09: "#FF9D4A",
};

const CAMERA_LABELS: Record<string, string> = {
  cargo: "Cargo",
  index: "Index",
  revival: "Revival",
  biostock: "Biostock",
  steerage: "Steerage",
  preservation: "Preservation",
  cryoHub: "CryoHub",
  camera06: "Camera 06",
  camera09: "Camera 09",
};

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

export function StabilizationChart() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [cameras, setCameras] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/stabilization/history?limit=288");
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const json = await res.json();

        const rows: StabRow[] = json.data ?? [];
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

        // Extract camera names from first row
        const camNames = Object.keys(sorted[0].cameras).sort();
        setCameras(camNames);

        setData(
          sorted.map((r) => {
            const point: DataPoint = { timestamp: r.captured_at };
            for (const cam of camNames) {
              point[cam] = r.cameras[cam]?.stabilizationLevel ?? 0;
            }
            return point;
          }),
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load chart",
        );
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
    <div className="cryo-panel p-4 sm:p-5" role="img" aria-label="Stabilization levels chart showing camera stabilization trends over time">
      <div className="h-[320px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
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
              stroke="#5A7A8A"
              tick={{ fontSize: 10, fill: "#5A7A8A" }}
              axisLine={{ stroke: "#1A4660" }}
              tickLine={{ stroke: "#1A4660" }}
              width={40}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              labelFormatter={(label) => formatTooltipTime(label as string)}
              formatter={(value, name) => [
                `${Number(value)}%`,
                CAMERA_LABELS[name as string] ?? name,
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
            <Legend
              formatter={(value) => CAMERA_LABELS[value] ?? value}
              wrapperStyle={{ fontSize: 10, color: "#8AACB8" }}
            />
            {cameras.map((cam) => (
              <Line
                key={cam}
                type="monotone"
                dataKey={cam}
                stroke={CAMERA_COLORS[cam] ?? "#8AACB8"}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
