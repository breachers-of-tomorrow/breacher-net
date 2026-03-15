"use client";

import { useEffect, useState, useCallback } from "react";
import { toLocalTimeOnly, formatCountdown } from "@/lib/format";
import { CAMERA_NAMES } from "@/lib/types";
import type { CameraName } from "@/lib/types";
import { StabilizationChart } from "@/components/StabilizationChart";

interface CameraData {
  stabilizationLevel: number;
  nextStabilizationAt: string | null;
}

interface Props {
  initialData: Record<string, CameraData> | null;
}

const STAB_API = "/api/stabilization/live";
const REFRESH_INTERVAL = 60_000;

/** Human-friendly camera name */
function displayName(name: string): string {
  const map: Record<string, string> = {
    cargo: "Cargo",
    index: "Index",
    revival: "Revival",
    biostock: "Biostock",
    steerage: "Steerage",
    preservation: "Preservation",
    cryoHub: "Cryo Hub",
    camera06: "Camera 06",
    camera09: "Camera 09",
  };
  return map[name] || name;
}

/** Stabilization level color */
function levelColor(level: number): string {
  if (level >= 80) return "text-accent2 glow-accent2";
  if (level >= 50) return "text-accent glow-accent";
  if (level >= 25) return "text-warn";
  return "text-danger glow-danger";
}

function levelBorderColor(level: number): string {
  if (level >= 80) return "border-accent2/30";
  if (level >= 50) return "border-accent/30";
  if (level >= 25) return "border-warn/30";
  return "border-danger/30";
}

function levelGradient(level: number): string {
  if (level >= 80) return "from-accent2";
  if (level >= 50) return "from-accent";
  if (level >= 25) return "from-warn";
  return "from-danger";
}

export function CamerasClient({ initialData }: Props) {
  const [data, setData] = useState<Record<string, CameraData> | null>(
    initialData
  );
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch(`${STAB_API}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const json = await res.json();
      const stab = json?.stabilization;
      if (!stab) throw new Error("Invalid response");
      setData(stab);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchLive, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLive]);

  if (!data) {
    return (
      <div className="text-center py-20">
        <div className="font-[var(--font-display)] text-sm tracking-[6px] text-accent animate-blink">
          CONNECTING TO CAMERA FEED...
        </div>
        {error && (
          <div className="mt-4 text-danger text-sm">ERROR: {error}</div>
        )}
      </div>
    );
  }

  // Find cameras below threshold (< 80)
  const alerts = Object.entries(data)
    .filter(([, cam]) => cam.stabilizationLevel < 80)
    .sort(([, a], [, b]) => a.stabilizationLevel - b.stabilizationLevel);

  // Find next stabilization time
  const nextStabTimes = Object.values(data)
    .map((c) => c.nextStabilizationAt)
    .filter(Boolean)
    .map((t) => new Date(t!))
    .filter((d) => !isNaN(d.getTime()) && d > new Date())
    .sort((a, b) => a.getTime() - b.getTime());
  const nextStab = nextStabTimes[0] ?? null;

  return (
    <div>
      {/* Error */}
      {error && (
        <div className="bg-danger/10 border border-danger p-3 text-danger text-sm mb-5">
          {/* ERROR */} {error}
        </div>
      )}

      {/* Next Stabilization */}
      {nextStab && (
        <div className="bg-panel border-b border-border p-2 px-4 flex items-center gap-4 text-xs mb-6">
          <span className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim">
            NEXT STABILIZATION
          </span>
          <span className="text-accent">{toLocalTimeOnly(nextStab)}</span>
          <span className="text-accent2 text-sm">
            {formatCountdown(nextStab)}
          </span>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <div className="section-title">⚠ STABILIZATION ALERTS</div>
          <div className="space-y-2">
            {alerts.map(([name, cam]) => (
              <div
                key={name}
                className="cryo-panel p-4 border-danger/30 flex items-center gap-4"
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-danger to-transparent" />
                <div className="font-[var(--font-display)] text-xs tracking-[3px] text-danger">
                  {displayName(name)}
                </div>
                <div className="font-[var(--font-display)] text-lg font-bold text-danger glow-danger ml-auto">
                  {cam.stabilizationLevel}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Camera Grid */}
      <div className="section-title">CCTV STABILIZATION</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {CAMERA_NAMES.map((name) => {
          const cam = data[name];
          if (!cam) return null;
          return (
            <CameraCard
              key={name}
              name={name}
              level={cam.stabilizationLevel}
              nextAt={cam.nextStabilizationAt}
            />
          );
        })}
      </div>

      {/* Stabilization Chart */}
      <div className="section-title">STABILIZATION OVER TIME</div>
      <StabilizationChart />
    </div>
  );
}

function CameraCard({
  name,
  level,
  nextAt,
}: {
  name: CameraName;
  level: number;
  nextAt: string | null;
}) {
  const next = nextAt ? new Date(nextAt) : null;
  const validNext = next && !isNaN(next.getTime()) ? next : null;

  return (
    <div className={`cryo-panel p-5 ${levelBorderColor(level)}`}>
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${levelGradient(level)} to-transparent`}
      />
      <div className="flex items-center justify-between mb-3">
        <div className="font-[var(--font-display)] text-xs tracking-[3px] text-dim uppercase">
          {displayName(name)}
        </div>
        <div
          className={`font-[var(--font-display)] text-2xl font-bold ${levelColor(level)}`}
        >
          {level}%
        </div>
      </div>

      {/* Level bar */}
      <div className="h-1.5 bg-border overflow-hidden mb-3">
        <div
          className={`h-full transition-[width] duration-500 ${
            level >= 80
              ? "bg-accent2"
              : level >= 50
                ? "bg-accent"
                : level >= 25
                  ? "bg-warn"
                  : "bg-danger"
          }`}
          style={{ width: `${level}%` }}
        />
      </div>

      {validNext && (
        <div className="text-[0.65rem] text-dim">
          Next: {toLocalTimeOnly(validNext)}{" "}
          <span className="text-accent2">{formatCountdown(validNext)}</span>
        </div>
      )}
    </div>
  );
}
