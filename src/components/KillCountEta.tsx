"use client";

import { useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TARGET = 500_000_000;
const HISTORY_API = "/api/state/history?limit=1000";

/* ------------------------------------------------------------------ */
/*  Flat-average projection model                                      */
/*                                                                     */
/*  1. Compute overall KPM from total kills / total time               */
/*  2. Project ETA linearly: remaining kills / avg KPM                 */
/* ------------------------------------------------------------------ */

interface HistoryRow {
  captured_at: string;
  kill_count: string | number;
}

interface Projection {
  /** Estimated Date when 500M is reached */
  eta: Date;
  /** Kills remaining to target */
  remaining: number;
  /** Current KPM (last ~45 min average) */
  currentKpm: number;
  /** Average KPM across all history */
  avgKpm: number;
  /** How many days of data the model is based on */
  dataSpanDays: number;
}

/**
 * Compute current KPM from recent data (~last 45 min).
 */
function recentKpm(rows: HistoryRow[]): number {
  const sorted = [...rows].sort(
    (a, b) =>
      new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime(),
  );
  if (sorted.length < 2) return 0;

  // Find points within last ~45 min
  const latest = new Date(sorted[sorted.length - 1].captured_at).getTime();
  const cutoff = latest - 45 * 60_000;
  const recent = sorted.filter(
    (r) => new Date(r.captured_at).getTime() >= cutoff,
  );

  if (recent.length < 2) return 0;
  const dt =
    (new Date(recent[recent.length - 1].captured_at).getTime() -
      new Date(recent[0].captured_at).getTime()) /
    60_000;
  const dk =
    Number(recent[recent.length - 1].kill_count) -
    Number(recent[0].kill_count);

  return dt > 0 && dk > 0 ? Math.round(dk / dt) : 0;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function KillCountEta({
  currentKills,
}: {
  currentKills: number;
}) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  // Fetch history once
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(HISTORY_API);
        if (!res.ok) return;
        const json = await res.json();
        setRows(json.data ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Tick every second for live countdown
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Build projection
  const projection = useMemo((): Projection | null => {
    if (rows.length < 10) return null;

    const sorted = [...rows].sort(
      (a, b) =>
        new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime(),
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalMinutes =
      (new Date(last.captured_at).getTime() -
        new Date(first.captured_at).getTime()) /
      60_000;
    const totalKills =
      Number(last.kill_count) - Number(first.kill_count);

    if (totalMinutes <= 0 || totalKills <= 0) return null;

    const avgKpm = Math.round(totalKills / totalMinutes);
    const remaining = TARGET - currentKills;
    const minutesLeft = remaining / avgKpm;
    const eta = new Date(Date.now() + minutesLeft * 60_000);
    const dataSpanDays = totalMinutes / (60 * 24);
    const curKpm = recentKpm(rows);

    return {
      eta,
      remaining,
      currentKpm: curKpm,
      avgKpm,
      dataSpanDays,
    };
  }, [rows, currentKills]);

  // Already reached target
  if (currentKills >= TARGET) {
    return (
      <div className="cryo-panel p-5 mb-8">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent2 to-transparent" />
        <div className="font-[var(--font-display)] text-[0.65rem] tracking-[3px] text-dim mb-2">
          500M TARGET
        </div>
        <div className="font-[var(--font-display)] text-2xl font-black text-accent2 glow-accent2 tracking-wider">
          TARGET REACHED
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cryo-panel p-5 mb-8 h-[100px] flex items-center justify-center">
        <div className="font-[var(--font-display)] text-xs tracking-[4px] text-dim animate-blink">
          CALCULATING PROJECTION...
        </div>
      </div>
    );
  }

  if (!projection) {
    return (
      <div className="cryo-panel p-5 mb-8">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-warn to-transparent" />
        <div className="font-[var(--font-display)] text-[0.65rem] tracking-[3px] text-dim mb-2">
          ETA TO 500M KILLS
        </div>
        <div className="text-sm text-dim">
          Insufficient data for projection
        </div>
      </div>
    );
  }

  const { eta, remaining, currentKpm, avgKpm, dataSpanDays } = projection;

  // Live countdown
  const msLeft = Math.max(0, eta.getTime() - Date.now());
  const totalSecs = Math.floor(msLeft / 1000);
  const days = Math.floor(totalSecs / 86400);
  const hrs = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  // Progress bar
  const progress = Math.min(
    100,
    ((currentKills / TARGET) * 100),
  );

  return (
    <div className="cryo-panel p-5 mb-8">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-warn to-transparent" />

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="font-[var(--font-display)] text-[0.65rem] tracking-[3px] text-dim mb-1">
            ETA TO 500M KILLS
          </div>
          <div className="font-[var(--font-display)] text-2xl sm:text-3xl font-black text-warn tracking-wider">
            {days > 0 && (
              <span>
                {days}
                <span className="text-dim text-base">d</span>{" "}
              </span>
            )}
            <span>
              {String(hrs).padStart(2, "0")}
              <span className="text-dim text-base">h</span>{" "}
            </span>
            <span>
              {String(mins).padStart(2, "0")}
              <span className="text-dim text-base">m</span>{" "}
            </span>
            <span>
              {String(secs).padStart(2, "0")}
              <span className="text-dim text-base">s</span>
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="font-[var(--font-display)] text-[0.55rem] tracking-[2px] text-dim mb-1">
            ESTIMATED ARRIVAL
          </div>
          <div className="font-[var(--font-display)] text-sm font-bold text-warn tracking-wider">
            {eta.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {" "}
            {eta.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[0.6rem] text-dim mb-1">
          <span>{formatNumber(currentKills)}</span>
          <span>{formatNumber(TARGET)}</span>
        </div>
        <div className="h-2 bg-border overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-danger to-warn transition-[width] duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[0.6rem] text-dim mt-1">
          {progress.toFixed(1)}% — {formatNumber(remaining)} remaining
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 flex-wrap text-[0.6rem]">
        <div>
          <span className="font-[var(--font-display)] tracking-[2px] text-dim">
            CURRENT RATE{" "}
          </span>
          <span className="text-text-body font-bold">
            {currentKpm > 0
              ? `${formatNumber(currentKpm)} KPM`
              : "—"}
          </span>
        </div>
        <div>
          <span className="font-[var(--font-display)] tracking-[2px] text-dim">
            AVG RATE{" "}
          </span>
          <span className="text-text-body font-bold">
            {formatNumber(avgKpm)} KPM
          </span>
        </div>
        <div>
          <span className="font-[var(--font-display)] tracking-[2px] text-dim">
            MODEL{" "}
          </span>
          <span className="text-text-body">
            flat-average ({dataSpanDays.toFixed(1)}d of data)
          </span>
        </div>
      </div>
    </div>
  );
}
