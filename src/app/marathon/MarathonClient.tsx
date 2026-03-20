"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { formatNumber, timeAgo } from "@/lib/format";
import { URLS } from "@/lib/urls";
import type { RangeLabel } from "@/lib/chart-utils";

/* ------------------------------------------------------------------ */
/*  Lazy-loaded chart components (client-only, no SSR)                 */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  initialKillCount: number | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const STATE_API = "/api/state/latest";

export function MarathonClient({ initialKillCount }: Props) {
  const [killCount, setKillCount] = useState<number | null>(initialKillCount);
  const [lastFetch, setLastFetch] = useState<Date | null>(
    initialKillCount !== null ? new Date() : null,
  );

  // Shared chart time range — syncs kill chart and player chart
  const [chartRange, setChartRange] = useState<RangeLabel>("24H");

  // Refresh kill count from API (lightweight — just the latest state)
  const refreshKillCount = async () => {
    try {
      const res = await fetch(`${STATE_API}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const json = await res.json();
      const kc = json?.data?.killCount;
      if (typeof kc === "number") {
        setKillCount(kc);
        setLastFetch(new Date());
      }
    } catch {
      // Silently fail — charts have their own data sources
    }
  };

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="font-[var(--font-display)] text-2xl sm:text-4xl font-black text-accent glow-accent tracking-[6px] mb-3">
          MARATHON METRICS
        </h1>
        <p className="text-dim text-sm sm:text-base tracking-[2px] max-w-2xl mx-auto">
          KILL COUNTS, PLAYER DATA, ANALYTICS, AND PROJECTIONS
        </p>
      </div>

      {/* Quick links */}
      <div className="flex items-center justify-center gap-4 flex-wrap mb-10">
        <a
          href={URLS.weaponsDb}
          target="_blank"
          rel="noopener noreferrer"
          className="font-[var(--font-display)] text-[0.65rem] tracking-[2px] px-4 py-2 border border-accent2 text-accent2 hover:bg-accent2/10 transition-colors no-underline"
        >
          WEAPONS DATABASE ↗
        </a>
        <a
          href={URLS.cryoarchive}
          target="_blank"
          rel="noopener noreferrer"
          className="font-[var(--font-display)] text-[0.65rem] tracking-[2px] px-4 py-2 border border-border text-dim hover:border-accent hover:text-accent transition-colors no-underline"
        >
          CRYOARCHIVE.SYSTEMS ↗
        </a>
      </div>

      {/* KILL COUNT HERO STAT */}
      <div className="section-title">UESC KILL COUNT</div>
      <div
        className="cryo-panel p-6 mb-8 flex items-center gap-8 flex-wrap cursor-pointer hover:border-accent/30 transition-colors"
        onClick={refreshKillCount}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") refreshKillCount();
        }}
        aria-label="Click to refresh kill count"
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-danger to-transparent" />
        <div>
          <div className="font-[var(--font-display)] text-[0.65rem] tracking-[3px] text-dim">
            TOTAL KILLS
          </div>
          <div className="font-[var(--font-display)] text-4xl font-black text-danger glow-danger tracking-wider mt-1">
            {killCount !== null ? formatNumber(killCount) : "—"}
          </div>
        </div>
        <div className="ml-auto text-right">
          {lastFetch && (
            <div className="text-[0.65rem] text-dim">
              Updated {timeAgo(lastFetch)}
            </div>
          )}
          <div className="text-[0.55rem] text-dim mt-1">
            Click to refresh
          </div>
        </div>
      </div>

      {/* ETA TO 500M */}
      <KillCountEta currentKills={killCount ?? 0} />

      {/* Kill Count Chart */}
      <div className="section-title">KILL COUNT OVER TIME</div>
      <KillCountChart range={chartRange} onRangeChange={setChartRange} />

      {/* Player Count Chart (synced time range) */}
      <div className="section-title mt-8">STEAM PLAYERS OVER TIME</div>
      <PlayerCountChart range={chartRange} onRangeChange={setChartRange} />

      {/* Kill Analytics */}
      <div className="section-title mt-8">KILL ANALYTICS</div>
      <KillAnalytics />
    </div>
  );
}
