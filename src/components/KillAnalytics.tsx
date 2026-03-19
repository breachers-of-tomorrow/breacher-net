"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StateRow {
  captured_at: string;
  kill_count: string | number;
}

interface SteamRow {
  captured_at: string;
  player_count: number;
}

interface AnalyticsData {
  // Current snapshot
  currentKills: number;
  currentPlayers: number;
  killsPerPlayer: number;
  currentKpm: number;

  // Period aggregates
  periodKills: number;
  periodMinutes: number;
  avgKpm: number;
  peakKpm: number;
  peakKpmTime: string;
  lowKpm: number;
  lowKpmTime: string;

  // Player stats
  avgPlayers: number;
  peakPlayers: number;
  peakPlayersTime: string;
  lowPlayers: number;
  lowPlayersTime: string;

  // Derived
  killsPerPlayerPerHour: number;
  kpmPerThousandPlayers: number;

  // Trend
  kpmTrend: "rising" | "falling" | "stable";
  playerTrend: "rising" | "falling" | "stable";
}

/* ------------------------------------------------------------------ */
/*  Compute analytics from paired kill + player data                   */
/* ------------------------------------------------------------------ */

function computeAnalytics(
  stateRows: StateRow[],
  steamRows: SteamRow[],
): AnalyticsData | null {
  if (stateRows.length < 2 || steamRows.length < 2) return null;

  const sortedState = [...stateRows]
    .filter((r) => r.kill_count !== null && r.kill_count !== undefined)
    .sort(
      (a, b) =>
        new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime(),
    );
  const sortedSteam = [...steamRows].sort(
    (a, b) =>
      new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime(),
  );

  // Current values
  const latestState = sortedState[sortedState.length - 1];
  const latestSteam = sortedSteam[sortedSteam.length - 1];
  const currentKills = Number(latestState.kill_count);
  const currentPlayers = Number(latestSteam.player_count);

  // Period kills and KPM (deduped change points)
  const changePoints: { ts: number; kc: number }[] = [];
  let prevKc = -1;
  for (const row of sortedState) {
    const kc = Number(row.kill_count);
    if (kc !== prevKc) {
      changePoints.push({
        ts: new Date(row.captured_at).getTime(),
        kc,
      });
      prevKc = kc;
    }
  }

  const periodKills =
    changePoints.length >= 2
      ? changePoints[changePoints.length - 1].kc - changePoints[0].kc
      : 0;
  const periodMinutes =
    changePoints.length >= 2
      ? (changePoints[changePoints.length - 1].ts - changePoints[0].ts) /
      60_000
      : 0;
  const avgKpm = periodMinutes > 0 ? periodKills / periodMinutes : 0;

  // Compute point-to-point KPM for peak/low detection
  const kpmSeries: { kpm: number; time: string }[] = [];
  for (let i = 1; i < changePoints.length; i++) {
    const dt = (changePoints[i].ts - changePoints[i - 1].ts) / 60_000;
    const dk = changePoints[i].kc - changePoints[i - 1].kc;
    if (dt > 0 && dk > 0 && dt < 60) {
      kpmSeries.push({
        kpm: dk / dt,
        time: new Date(changePoints[i].ts).toISOString(),
      });
    }
  }

  // Apply rolling average to KPM series for peak/low (avoid noise)
  const smoothedKpm = rollingAvg(
    kpmSeries.map((k) => k.kpm),
    5,
  );
  let peakKpmIdx = 0;
  let lowKpmIdx = 0;
  for (let i = 0; i < smoothedKpm.length; i++) {
    if (smoothedKpm[i] > smoothedKpm[peakKpmIdx]) peakKpmIdx = i;
    if (smoothedKpm[i] < smoothedKpm[lowKpmIdx]) lowKpmIdx = i;
  }

  // Current KPM from last ~45 min
  const recentCutoff =
    changePoints[changePoints.length - 1].ts - 45 * 60_000;
  const recentPoints = changePoints.filter((p) => p.ts >= recentCutoff);
  const currentKpm =
    recentPoints.length >= 2
      ? (recentPoints[recentPoints.length - 1].kc - recentPoints[0].kc) /
      ((recentPoints[recentPoints.length - 1].ts - recentPoints[0].ts) /
        60_000)
      : avgKpm;

  // Player stats
  const playerCounts = sortedSteam.map((r) => ({
    count: Number(r.player_count),
    time: r.captured_at,
  }));
  const avgPlayers =
    playerCounts.reduce((s, p) => s + p.count, 0) / playerCounts.length;
  let peakPlayerEntry = playerCounts[0];
  let lowPlayerEntry = playerCounts[0];
  for (const p of playerCounts) {
    if (p.count > peakPlayerEntry.count) peakPlayerEntry = p;
    if (p.count < lowPlayerEntry.count) lowPlayerEntry = p;
  }

  // KPM Trend: compare last quarter avg to first quarter avg
  const kpmTrend = computeTrend(smoothedKpm);

  // Player trend
  const playerTrend = computeTrend(
    playerCounts.map((p) => p.count),
  );

  // Derived metrics
  const killsPerPlayer =
    currentPlayers > 0 ? Math.round(currentKills / currentPlayers) : 0;
  const killsPerPlayerPerHour =
    currentPlayers > 0 && currentKpm > 0
      ? (currentKpm * 60) / currentPlayers
      : 0;
  const kpmPerThousandPlayers =
    currentPlayers > 0
      ? (currentKpm / currentPlayers) * 1000
      : 0;

  return {
    currentKills,
    currentPlayers,
    killsPerPlayer,
    currentKpm: Math.round(currentKpm),
    periodKills,
    periodMinutes: Math.round(periodMinutes),
    avgKpm: Math.round(avgKpm),
    peakKpm: Math.round(smoothedKpm[peakKpmIdx] ?? 0),
    peakKpmTime: kpmSeries[peakKpmIdx]?.time ?? "",
    lowKpm: Math.round(smoothedKpm[lowKpmIdx] ?? 0),
    lowKpmTime: kpmSeries[lowKpmIdx]?.time ?? "",
    avgPlayers: Math.round(avgPlayers),
    peakPlayers: peakPlayerEntry.count,
    peakPlayersTime: peakPlayerEntry.time,
    lowPlayers: lowPlayerEntry.count,
    lowPlayersTime: lowPlayerEntry.time,
    killsPerPlayerPerHour: Math.round(killsPerPlayerPerHour * 10) / 10,
    kpmPerThousandPlayers: Math.round(kpmPerThousandPlayers * 10) / 10,
    kpmTrend,
    playerTrend,
  };
}

function rollingAvg(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - window);
    const end = Math.min(values.length - 1, i + window);
    let sum = 0;
    let count = 0;
    for (let j = start; j <= end; j++) {
      sum += values[j];
      count++;
    }
    return sum / count;
  });
}

function computeTrend(
  values: number[],
): "rising" | "falling" | "stable" {
  if (values.length < 4) return "stable";
  const q = Math.floor(values.length / 4);
  const firstQ = values.slice(0, q);
  const lastQ = values.slice(-q);
  const firstAvg = firstQ.reduce((a, b) => a + b, 0) / firstQ.length;
  const lastAvg = lastQ.reduce((a, b) => a + b, 0) / lastQ.length;
  const pct = firstAvg > 0 ? ((lastAvg - firstAvg) / firstAvg) * 100 : 0;
  if (pct > 5) return "rising";
  if (pct < -5) return "falling";
  return "stable";
}

function formatTimeShort(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function trendIcon(trend: "rising" | "falling" | "stable"): string {
  if (trend === "rising") return "▲";
  if (trend === "falling") return "▼";
  return "→";
}

function trendColor(trend: "rising" | "falling" | "stable"): string {
  if (trend === "rising") return "text-mint";
  if (trend === "falling") return "text-danger";
  return "text-dim";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function KillAnalytics() {
  const [stateRows, setStateRows] = useState<StateRow[]>([]);
  const [steamRows, setSteamRows] = useState<SteamRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [stateRes, steamRes] = await Promise.all([
          fetch("/api/state/history?limit=1000"),
          fetch("/api/steam/history?limit=1000"),
        ]);

        if (stateRes.ok) {
          const stateJson = await stateRes.json();
          setStateRows(stateJson.data ?? []);
        }
        if (steamRes.ok) {
          const steamJson = await steamRes.json();
          setSteamRows(steamJson.data ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const analytics = useMemo(
    () => computeAnalytics(stateRows, steamRows),
    [stateRows, steamRows],
  );

  if (loading) {
    return (
      <div className="cryo-panel p-5 h-[120px] flex items-center justify-center">
        <div className="font-[var(--font-display)] text-xs tracking-[4px] text-dim animate-blink">
          COMPUTING ANALYTICS...
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="cryo-panel p-5 flex items-center justify-center">
        <div className="text-dim text-sm tracking-[2px]">
          INSUFFICIENT DATA FOR ANALYTICS
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary metric: Kills per Player */}
      <div className="cryo-panel p-5">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent2 to-mint" />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="font-[var(--font-display)] text-[0.65rem] tracking-[3px] text-dim mb-1">
              KILLS PER PLAYER
            </div>
            <div className="font-[var(--font-display)] text-3xl font-black text-accent2 glow-accent2 tracking-wider">
              {formatNumber(analytics.killsPerPlayer)}
            </div>
            <div className="text-[0.6rem] text-dim mt-1">
              cumulative total kills ÷ current online players
            </div>
          </div>
          <div className="text-right">
            <div className="font-[var(--font-display)] text-[0.55rem] tracking-[2px] text-dim mb-1">
              KILL RATE PER PLAYER
            </div>
            <div className="font-[var(--font-display)] text-xl font-bold text-accent tracking-wider">
              {analytics.killsPerPlayerPerHour}
              <span className="text-dim text-xs ml-1">kills/hr/player</span>
            </div>
            <div className="text-[0.6rem] text-dim mt-1">
              {analytics.kpmPerThousandPlayers} KPM per 1K players
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Kill velocity */}
        <StatCard
          label="CURRENT KPM"
          value={formatNumber(analytics.currentKpm)}
          subtext="kills per minute"
          trend={analytics.kpmTrend}
        />
        <StatCard
          label="AVG KPM"
          value={formatNumber(analytics.avgKpm)}
          subtext={`over ${Math.round(analytics.periodMinutes / 60)}h`}
        />
        <StatCard
          label="PEAK KPM"
          value={formatNumber(analytics.peakKpm)}
          subtext={`at ${formatTimeShort(analytics.peakKpmTime)}`}
          accent="mint"
        />
        <StatCard
          label="LOW KPM"
          value={formatNumber(analytics.lowKpm)}
          subtext={`at ${formatTimeShort(analytics.lowKpmTime)}`}
          accent="warn"
        />

        {/* Player stats */}
        <StatCard
          label="ONLINE NOW"
          value={formatNumber(analytics.currentPlayers)}
          subtext="Steam players"
          trend={analytics.playerTrend}
        />
        <StatCard
          label="AVG PLAYERS"
          value={formatNumber(analytics.avgPlayers)}
          subtext="in period"
        />
        <StatCard
          label="PEAK PLAYERS"
          value={formatNumber(analytics.peakPlayers)}
          subtext={`at ${formatTimeShort(analytics.peakPlayersTime)}`}
          accent="mint"
        />
        <StatCard
          label="LOW PLAYERS"
          value={formatNumber(analytics.lowPlayers)}
          subtext={`at ${formatTimeShort(analytics.lowPlayersTime)}`}
          accent="warn"
        />
      </div>

      {/* Period summary */}
      <div className="cryo-panel p-4 flex items-center gap-6 flex-wrap text-[0.6rem]">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-danger to-transparent" />
        <div>
          <span className="font-[var(--font-display)] tracking-[2px] text-dim">
            PERIOD KILLS{" "}
          </span>
          <span className="text-danger font-bold">
            +{formatNumber(analytics.periodKills)}
          </span>
        </div>
        <div>
          <span className="font-[var(--font-display)] tracking-[2px] text-dim">
            OVER{" "}
          </span>
          <span className="text-text-body">
            {Math.round(analytics.periodMinutes / 60)}h{" "}
            {Math.round(analytics.periodMinutes % 60)}m
          </span>
        </div>
        <div>
          <span className="font-[var(--font-display)] tracking-[2px] text-dim">
            EFFICIENCY{" "}
          </span>
          <span className="text-accent2 font-bold">
            {analytics.kpmPerThousandPlayers} KPM/1K
          </span>
          <span className="text-dim ml-1">(kills per min per 1K players)</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  subtext,
  accent,
  trend,
}: {
  label: string;
  value: string;
  subtext: string;
  accent?: "mint" | "warn" | "danger";
  trend?: "rising" | "falling" | "stable";
}) {
  const valueColor =
    accent === "mint"
      ? "text-mint"
      : accent === "warn"
        ? "text-warn"
        : accent === "danger"
          ? "text-danger"
          : "text-text-heading";

  return (
    <div className="cryo-panel p-3">
      <div className="font-[var(--font-display)] text-[0.5rem] tracking-[2px] text-dim mb-1 flex items-center gap-2">
        {label}
        {trend && (
          <span className={trendColor(trend)}>{trendIcon(trend)}</span>
        )}
      </div>
      <div
        className={`font-[var(--font-display)] text-lg font-bold tracking-wider ${valueColor}`}
      >
        {value}
      </div>
      <div className="text-[0.55rem] text-dim mt-0.5">{subtext}</div>
    </div>
  );
}
