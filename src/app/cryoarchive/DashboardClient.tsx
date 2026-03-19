"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import dynamic from "next/dynamic";
import { URLS } from "@/lib/urls";
import type { RangeLabel } from "@/lib/chart-utils";

const KillCountChart = dynamic(
  () => import("@/components/KillCountChart").then((m) => m.KillCountChart),
  {
    loading: () => (
      <div className="cryo-panel p-5 h-[300px] flex items-center justify-center">
        <div className="font-[var(--font-display)] text-xs tracking-[4px] text-dim animate-blink">
          LOADING CHART...
        </div>
      </div>
    ),
    ssr: false,
  },
);

const KillCountEta = dynamic(
  () => import("@/components/KillCountEta").then((m) => m.KillCountEta),
  {
    loading: () => (
      <div className="cryo-panel p-5 mb-8 h-[100px] flex items-center justify-center">
        <div className="font-[var(--font-display)] text-xs tracking-[4px] text-dim animate-blink">
          CALCULATING PROJECTION...
        </div>
      </div>
    ),
    ssr: false,
  },
);

const PlayerCountChart = dynamic(
  () =>
    import("@/components/PlayerCountChart").then((m) => m.PlayerCountChart),
  {
    loading: () => (
      <div className="cryo-panel p-5 h-[260px] flex items-center justify-center">
        <div className="font-[var(--font-display)] text-xs tracking-[4px] text-dim animate-blink">
          LOADING PLAYER DATA...
        </div>
      </div>
    ),
    ssr: false,
  },
);

const KillAnalytics = dynamic(
  () => import("@/components/KillAnalytics").then((m) => m.KillAnalytics),
  {
    loading: () => (
      <div className="cryo-panel p-5 h-[120px] flex items-center justify-center">
        <div className="font-[var(--font-display)] text-xs tracking-[4px] text-dim animate-blink">
          COMPUTING ANALYTICS...
        </div>
      </div>
    ),
    ssr: false,
  },
);

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

const STATE_API = "/api/state/latest";
const REFRESH_INTERVAL = 300_000; // 5 minutes — matches poller cadence

export function DashboardClient({ initialData }: Props) {
  const [data, setData] = useState<DashboardData | null>(initialData);
  const [lastFetch, setLastFetch] = useState<Date | null>(
    initialData ? new Date() : null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(!!initialData);
  const [prevKillCount, setPrevKillCount] = useState<number | null>(null);

  // Ref to track current data without triggering fetchLatest recreation
  const dataRef = useRef(data);
  dataRef.current = data;

  // Shared chart time range — syncs kill chart and player chart
  const [chartRange, setChartRange] = useState<RangeLabel>("24H");

  // Ticking state
  const [, setTick] = useState(0);

  // Auto-refresh from DB-backed API (polled every 5 min by Python poller)
  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch(`${STATE_API}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const json = await res.json();
      const d = json?.data;
      if (!d) throw new Error("No data available");

      if (dataRef.current) setPrevKillCount(dataRef.current.killCount);

      setData({
        killCount: d.killCount,
        nextUpdateAt: d.nextUpdate,
        shipDate: d.shipDate,
        memoryUnlocked: d.memoryFlags?.memoryUnlocked ?? false,
        memoryCompleted: d.memoryFlags?.memoryCompleted ?? false,
        sectors: Object.fromEntries(
          SECTOR_NAMES.map((name) => [
            name,
            {
              unlocked: d.sectors?.[name]?.unlocked ?? false,
              completed: d.sectors?.[name]?.completed ?? false,
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
  }, []);

  // 1-second tick for countdowns
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(fetchLatest, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchLatest]);

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
        <div role="alert" className="bg-danger/10 border border-danger p-3 text-danger text-sm mb-5">
          {/* ERROR */} {error}
        </div>
      )}

      {/* Next Update Bar */}
      {nextUpdate && (
        <NextUpdateBar nextUpdate={nextUpdate} />
      )}

      {/* CTA Banner */}
      <a
        href={URLS.communityDocHelp}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-gradient-to-br from-accent/[0.08] to-accent2/[0.05] border border-accent p-6 mb-8 flex items-center gap-5 relative overflow-hidden hover:border-accent2 hover:from-accent/[0.12] hover:to-accent2/[0.08] transition-all no-underline group"
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-accent2" />
        <div className="text-4xl shrink-0 drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]" aria-hidden="true">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 mb-3">
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
      <div className="cryo-panel p-6 mb-8 flex items-center gap-8 flex-wrap" aria-live="polite" aria-atomic="true">
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

      {/* ETA TO 500M */}
      <KillCountEta currentKills={data.killCount} />

      {/* Kill Count Chart */}
      <div className="section-title">KILL COUNT OVER TIME</div>
      <KillCountChart range={chartRange} onRangeChange={setChartRange} />

      {/* Player Count Chart (synced time range) */}
      <div className="section-title mt-8">STEAM PLAYERS OVER TIME</div>
      <PlayerCountChart range={chartRange} onRangeChange={setChartRange} />

      {/* Kill Analytics */}
      <div className="section-title mt-8">KILL ANALYTICS</div>
      <KillAnalytics />

      {/* SHIP DATE */}
      <div className="cryo-panel p-5 mt-8">
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
    </div>
  );
}

// ---- Sub-components ----

function NextUpdateBar({
  nextUpdate,
}: {
  nextUpdate: Date;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const secsLeft = Math.max(0, (nextUpdate.getTime() - now) / 1000);
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
      <div className="flex gap-2 flex-wrap">
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
      ? "border-border text-dim/60 bg-transparent"
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
      className={`flex items-center gap-2.5 px-4 py-2 bg-panel border relative ${on ? "border-accent2/30" : "border-border"
        }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${on ? "from-accent2" : "from-border"
          } to-transparent`}
      />
      <span className="font-[var(--font-display)] text-[0.55rem] tracking-[3px] text-dim">
        {label}
      </span>
      <span
        className={`font-[var(--font-display)] text-sm font-bold tracking-wider ${on ? "text-accent2 glow-accent2" : "text-dim"
          }`}
      >
        {value ? "TRUE" : "FALSE"}
      </span>
    </div>
  );
}
