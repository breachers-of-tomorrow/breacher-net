"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  formatNumber,
  toLocalTimeOnly,
  toUTCTimeOnly,
  formatShipCountdown,
  timeAgo,
  formatCountdown,
} from "@/lib/format";
import { SECTOR_NAMES } from "@/lib/types";
import type { SectorName } from "@/lib/types";

interface DashboardData {
  killCount: number;
  nextUpdateAt: string;
  shipDate: string;
  memoryUnlocked: boolean;
  memoryCompleted: boolean;
  sectors: Record<string, { unlocked: boolean; completed: boolean }>;
}

interface Props {
  initialData: DashboardData | null;
}

const STATE_API = "https://cryoarchive.systems/api/public/state";
const REFRESH_INTERVAL = 60_000; // 60 seconds

export function DashboardClient({ initialData }: Props) {
  const [data, setData] = useState<DashboardData | null>(initialData);
  const [lastFetch, setLastFetch] = useState<Date | null>(
    initialData ? new Date() : null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(!!initialData);
  const [prevKillCount, setPrevKillCount] = useState<number | null>(null);

  // Ticking state
  const [, setTick] = useState(0);

  // Auto-refresh via live API
  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch(`${STATE_API}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const json = await res.json();
      const state = json?.state;
      if (!state) throw new Error("Invalid API response");

      if (data) setPrevKillCount(data.killCount);

      setData({
        killCount: state.uescKillCount,
        nextUpdateAt: state.uescKillCountNextUpdateAt,
        shipDate: state.shipDate,
        memoryUnlocked: state.memoryUnlocked,
        memoryCompleted: state.memoryCompleted,
        sectors: Object.fromEntries(
          SECTOR_NAMES.map((name) => [
            name,
            {
              unlocked: state.pages?.[name]?.unlocked ?? false,
              completed: state.pages?.[name]?.completed ?? false,
            },
          ])
        ),
      });
      setLastFetch(new Date());
      setIsLive(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    }
  }, [data]);

  // 1-second tick for countdowns
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchLive, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLive]);

  // Smart refresh: when next update time passes, fetch after ~10s
  useEffect(() => {
    if (!data?.nextUpdateAt) return;
    const nextUpdate = new Date(data.nextUpdateAt);
    const delay = nextUpdate.getTime() - Date.now() + 10_000;
    if (delay <= 0 || delay > 20 * 60_000) return;
    const timeout = setTimeout(fetchLive, delay);
    return () => clearTimeout(timeout);
  }, [data?.nextUpdateAt, fetchLive]);

  if (!data) {
    return (
      <div className="text-center py-20">
        <div className="font-[var(--font-display)] text-sm tracking-[6px] text-accent animate-blink">
          CONNECTING TO DATA FEED...
        </div>
        {error && (
          <div className="mt-4 text-danger text-sm">ERROR: {error}</div>
        )}
      </div>
    );
  }

  const nextUpdate = data.nextUpdateAt
    ? new Date(data.nextUpdateAt)
    : null;
  const shipDate = data.shipDate ? new Date(data.shipDate) : null;
  const killDelta =
    prevKillCount !== null ? data.killCount - prevKillCount : null;

  return (
    <div>
      {/* Error banner */}
      {error && (
        <div className="bg-danger/10 border border-danger p-3 text-danger text-sm mb-5">
          // ERROR: {error}
        </div>
      )}

      {/* Next Update Bar */}
      {nextUpdate && (
        <NextUpdateBar nextUpdate={nextUpdate} lastFetch={lastFetch} />
      )}

      {/* CTA Banner */}
      <a
        href="https://docs.google.com/document/d/1mtUtDPvbh6ahiynYFVS7Z4O79Nw6y5PEOjweCpzWV_A/edit?tab=t.0#heading=h.5j4qeuoxhabo"
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-gradient-to-br from-accent/[0.08] to-accent2/[0.05] border border-accent p-6 mb-8 flex items-center gap-5 relative overflow-hidden hover:border-accent2 hover:from-accent/[0.12] hover:to-accent2/[0.08] transition-all no-underline group"
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-accent2" />
        <div className="text-4xl shrink-0 drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]">
          📡
        </div>
        <div className="flex-1">
          <div className="font-[var(--font-display)] text-xs tracking-[3px] text-accent glow-accent mb-1.5">
            HOW CAN I HELP?
          </div>
          <div className="text-sm text-foreground leading-relaxed">
            View current community objectives and contribute to the Breach
            Protocol effort.
          </div>
        </div>
        <div className="text-accent2 font-[var(--font-display)] text-xl group-hover:translate-x-1 transition-transform">
          →
        </div>
      </a>

      {/* SECTOR STATE */}
      <div className="section-title">SECTOR STATE</div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 mb-3">
        {SECTOR_NAMES.map((name) => (
          <SectorCard
            key={name}
            name={name}
            unlocked={data.sectors[name]?.unlocked ?? false}
            completed={data.sectors[name]?.completed ?? false}
          />
        ))}
      </div>

      {/* Memory Flags */}
      <div className="flex gap-5 flex-wrap mb-8">
        <StateFlag label="MEMORY UNLOCKED" value={data.memoryUnlocked} />
        <StateFlag label="MEMORY COMPLETED" value={data.memoryCompleted} />
      </div>

      {/* KILL COUNT */}
      <div className="section-title">UESC KILL COUNT</div>
      <div className="cryo-panel p-6 mb-8 flex items-center gap-8 flex-wrap">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-danger to-transparent" />
        <div>
          <div className="font-[var(--font-display)] text-[0.65rem] tracking-[3px] text-dim">
            TOTAL KILLS{" "}
            {isLive ? (
              <span className="font-[var(--font-display)] text-[0.55rem] tracking-[2px] px-2 py-0.5 border border-accent2 text-accent2 bg-accent2/[0.08] animate-pulse-slow ml-2.5">
                LIVE
              </span>
            ) : (
              <span className="font-[var(--font-display)] text-[0.55rem] tracking-[2px] px-2 py-0.5 border border-dim text-dim ml-2.5">
                CACHED
              </span>
            )}
          </div>
          <div className="font-[var(--font-display)] text-4xl font-black text-danger glow-danger tracking-wider mt-1">
            {formatNumber(data.killCount)}
          </div>
        </div>
        {killDelta !== null && killDelta !== 0 && (
          <div className="text-sm text-warn">
            {killDelta > 0 ? "▲" : "▼"} {formatNumber(Math.abs(killDelta))}{" "}
            since last refresh
          </div>
        )}
        <div className="ml-auto text-right">
          {nextUpdate && (
            <div className="text-[0.7rem] text-dim">
              NEXT UPDATE: {toLocalTimeOnly(nextUpdate)}
            </div>
          )}
          {lastFetch && (
            <div className="text-[0.65rem] text-dim mt-1">
              Updated {timeAgo(lastFetch)}
            </div>
          )}
        </div>
      </div>

      {/* SHIP DATE */}
      <div className="cryo-panel p-5 mb-8">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-transparent" />
        <div className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim mb-2">
          SHIP DATE
        </div>
        <div className="font-[var(--font-display)] text-lg font-bold text-accent glow-accent tracking-wider">
          {shipDate ? formatShipCountdown(shipDate) : "--"}
        </div>
        {shipDate && (
          <div className="text-[0.65rem] text-dim mt-1">
            {shipDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        )}
      </div>

      {/* CHART placeholder — future: Chart.js integration */}
      <div className="section-title">KILL COUNT OVER TIME</div>
      <div className="cryo-panel p-5 h-[300px] flex items-center justify-center">
        <div className="text-dim text-sm tracking-[2px]">
          CHART AVAILABLE AFTER DATABASE MIGRATION
        </div>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function NextUpdateBar({
  nextUpdate,
  lastFetch,
}: {
  nextUpdate: Date;
  lastFetch: Date | null;
}) {
  const secsLeft = Math.max(0, (nextUpdate.getTime() - Date.now()) / 1000);
  const intervalTotal = 15 * 60; // 15 minutes
  const elapsed = intervalTotal - secsLeft;
  const pct = Math.min(100, Math.max(0, (elapsed / intervalTotal) * 100));

  return (
    <div className="bg-panel border-b border-border p-2 px-4 flex items-center gap-4 text-xs mb-6">
      <span className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim">
        NEXT UPDATE
      </span>
      <span className="text-accent">{toLocalTimeOnly(nextUpdate)}</span>
      <span className="text-dim text-[0.65rem] ml-1.5">
        {toUTCTimeOnly(nextUpdate)}
      </span>
      <span className="text-accent2 text-sm">
        {formatCountdown(nextUpdate)}
      </span>
      <div className="flex-1 h-[3px] bg-border ml-2.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent2 to-accent box-glow-accent2 transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SectorCard({
  name,
  unlocked,
  completed,
}: {
  name: SectorName;
  unlocked: boolean;
  completed: boolean;
}) {
  const status = completed ? "completed" : unlocked ? "unlocked" : "locked";
  const borderColor =
    status === "completed"
      ? "border-accent2/30"
      : status === "unlocked"
        ? "border-accent/30"
        : "border-border opacity-60";
  const topGradient =
    status === "completed"
      ? "from-accent2"
      : status === "unlocked"
        ? "from-accent"
        : "from-border";
  const nameColor =
    status === "completed"
      ? "text-accent2 glow-accent2"
      : status === "unlocked"
        ? "text-accent glow-accent"
        : "text-dim";

  return (
    <div className={`cryo-panel p-4 ${borderColor}`}>
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${topGradient} to-transparent`}
      />
      <div
        className={`font-[var(--font-display)] text-[0.7rem] tracking-[3px] uppercase mb-3 ${nameColor}`}
      >
        {name.toUpperCase()}
      </div>
      <div className="flex gap-2">
        <Badge label="UNLOCKED" on={unlocked} />
        <Badge
          label="COMPLETED"
          on={completed}
          partial={unlocked && !completed}
        />
      </div>
    </div>
  );
}

function Badge({
  label,
  on,
  partial = false,
}: {
  label: string;
  on: boolean;
  partial?: boolean;
}) {
  const classes = on
    ? "border-accent2 text-accent2 bg-accent2/[0.08] box-glow-accent2"
    : partial
      ? "border-accent text-accent bg-accent/5"
      : "border-border text-dim";

  return (
    <div
      className={`text-[0.6rem] px-2.5 py-1 tracking-[1px] border ${classes}`}
    >
      {label}
    </div>
  );
}

function StateFlag({ label, value }: { label: string; value: boolean }) {
  const on = value;
  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-2 bg-panel border relative ${
        on ? "border-accent2/30" : "border-border"
      }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${
          on ? "from-accent2" : "from-border"
        } to-transparent`}
      />
      <span className="font-[var(--font-display)] text-[0.55rem] tracking-[3px] text-dim">
        {label}
      </span>
      <span
        className={`font-[var(--font-display)] text-sm font-bold tracking-wider ${
          on ? "text-accent2 glow-accent2" : "text-dim"
        }`}
      >
        {value ? "TRUE" : "FALSE"}
      </span>
    </div>
  );
}
