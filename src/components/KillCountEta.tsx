"use client";

import { useMemo, useState, useEffect } from "react";
import { useKillCountData } from "@/hooks";
import type { KillCountRow } from "@/hooks";
import { formatNumber } from "@/lib/format";
import { computeStaleness } from "@/lib/staleness";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TARGET = 500_000_000;

/* ------------------------------------------------------------------ */
/*  Diurnal-weighted projection model                                  */
/*                                                                     */
/*  1. Compute average KPM for each UTC hour from all history          */
/*  2. Walk forward hour-by-hour from "now" using each hour's rate     */
/*  3. Accumulate kills until we reach the remaining amount            */
/*  4. Result: projected date/time of arrival                          */
/* ------------------------------------------------------------------ */

interface HourlyRate {
  hour: number;
  kpm: number;
  samples: number;
}

interface Projection {
  /** Estimated Date when 500M is reached */
  eta: Date;
  /** Kills remaining to target */
  remaining: number;
  /** Current KPM (last ~30 min average) */
  currentKpm: number;
  /** Average KPM across all hours */
  avgKpm: number;
  /** The 24-hour rate profile used */
  hourlyRates: HourlyRate[];
  /** How many days of data the model is based on */
  dataSpanDays: number;
}

/**
 * Build the 24-hour KPM profile from historical data.
 * Groups all point-to-point rates by their UTC hour, then averages.
 */
function buildHourlyProfile(rows: KillCountRow[]): HourlyRate[] {
  const sorted = [...rows].sort(
    (a, b) =>
      new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime(),
  );

  // Deduplicate: keep only rows where kill_count actually changed.
  // The game state updates every ~15 min but we poll every ~5 min,
  // so ~2/3 of rows are duplicates. Without dedup, 15 min of kills
  // get attributed to a 5-min gap, inflating rates by ~3x.
  const changePoints: KillCountRow[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (Number(sorted[i].kill_count) !== Number(changePoints[changePoints.length - 1].kill_count)) {
      changePoints.push(sorted[i]);
    }
  }

  // Bucket: hour -> array of KPM observations
  const buckets: Map<number, number[]> = new Map();
  for (let h = 0; h < 24; h++) buckets.set(h, []);

  for (let i = 1; i < changePoints.length; i++) {
    const t0 = new Date(changePoints[i - 1].captured_at).getTime();
    const t1 = new Date(changePoints[i].captured_at).getTime();
    const kc0 = Number(changePoints[i - 1].kill_count);
    const kc1 = Number(changePoints[i].kill_count);
    const dtMin = (t1 - t0) / 60_000;

    // Skip gaps > 60 min (missing data) and zero/negative deltas
    if (dtMin <= 0 || dtMin > 60 || kc1 <= kc0) continue;

    const kpm = (kc1 - kc0) / dtMin;
    const hour = new Date(t1).getUTCHours();
    buckets.get(hour)!.push(kpm);
  }

  // Compute averages, fill gaps with overall average
  const rates: HourlyRate[] = [];
  let totalKpm = 0;
  let totalSamples = 0;

  for (let h = 0; h < 24; h++) {
    const samples = buckets.get(h)!;
    if (samples.length > 0) {
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      rates.push({ hour: h, kpm: Math.round(avg), samples: samples.length });
      totalKpm += avg;
      totalSamples++;
    } else {
      rates.push({ hour: h, kpm: 0, samples: 0 });
    }
  }

  // Fill any empty hours with the overall average
  const overallAvg =
    totalSamples > 0 ? Math.round(totalKpm / totalSamples) : 0;
  for (const r of rates) {
    if (r.samples === 0) r.kpm = overallAvg;
  }

  return rates;
}

/**
 * Walk forward from now using the hourly rate profile until we
 * accumulate enough kills to reach the target.
 */
function projectEta(
  currentKills: number,
  hourlyRates: HourlyRate[],
): Date | null {
  const remaining = TARGET - currentKills;
  if (remaining <= 0) return new Date(); // Already hit!

  let accumulated = 0;
  const now = new Date();
  let cursor = new Date(now);

  // Walk forward in 1-minute increments for accuracy
  // Cap at 60 days to avoid infinite loop
  const maxMinutes = 60 * 24 * 60;

  for (let m = 0; m < maxMinutes; m++) {
    const hour = cursor.getUTCHours();
    const kpm = hourlyRates[hour]?.kpm ?? 0;
    accumulated += kpm;

    if (accumulated >= remaining) {
      return cursor;
    }

    cursor = new Date(cursor.getTime() + 60_000);
  }

  // Fallback: couldn't project within 60 days
  return null;
}

/**
 * Compute current KPM from recent data (~last 30 min).
 */
function recentKpm(rows: KillCountRow[]): number {
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
  const { rows, loading } = useKillCountData();
  const [now, setNow] = useState(() => Date.now());

  // Tick every second for live countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Detect stale data
  const staleness = useMemo(
    () => computeStaleness(rows),
    [rows],
  );

  // Build projection
  const projection = useMemo((): Projection | null => {
    if (rows.length < 10) return null;

    const hourlyRates = buildHourlyProfile(rows);
    const eta = projectEta(currentKills, hourlyRates);
    const curKpm = recentKpm(rows);

    // Data span
    const sorted = [...rows].sort(
      (a, b) =>
        new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime(),
    );
    const spanMs =
      new Date(sorted[sorted.length - 1].captured_at).getTime() -
      new Date(sorted[0].captured_at).getTime();
    const dataSpanDays = spanMs / (1000 * 60 * 60 * 24);

    const avgKpm =
      Math.round(
        hourlyRates.reduce((s, r) => s + r.kpm, 0) / hourlyRates.length,
      );

    if (!eta) return null;

    return {
      eta,
      remaining: TARGET - currentKills,
      currentKpm: curKpm,
      avgKpm,
      hourlyRates,
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

  // When data is stale, show paused state instead of ticking countdown
  if (staleness?.isStale) {
    // Progress bar (still valid — uses currentKills which is the high-water mark)
    const progress = Math.min(100, (currentKills / TARGET) * 100);

    return (
      <div className="cryo-panel p-5 mb-8">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-warn to-transparent" />

        {/* Header row */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <div className="font-[var(--font-display)] text-[0.65rem] tracking-[3px] text-dim mb-1">
              ETA TO 500M KILLS
            </div>
            <div className="font-[var(--font-display)] text-xl font-bold text-warn/70 tracking-wider">
              PROJECTION PAUSED
            </div>
            <div className="text-[0.6rem] text-dim mt-1">
              Data collection paused — ETA will resume when fresh data arrives
            </div>
          </div>
          <div className="text-right">
            <div className="font-[var(--font-display)] text-[0.55rem] tracking-[2px] text-dim mb-1">
              LAST ESTIMATE
            </div>
            <div className="font-[var(--font-display)] text-sm font-bold text-dim tracking-wider">
              {eta.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
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
              diurnal-weighted ({dataSpanDays.toFixed(1)}d of data)
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Live countdown
  const msLeft = Math.max(0, eta.getTime() - now);
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
            diurnal-weighted ({dataSpanDays.toFixed(1)}d of data)
          </span>
        </div>
      </div>
    </div>
  );
}
