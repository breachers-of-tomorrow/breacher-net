"use client";

import type { StalenessInfo } from "@/lib/staleness";

/* ------------------------------------------------------------------ */
/*  DataStaleBanner                                                    */
/*                                                                     */
/*  Prominent warning banner displayed when upstream data collection   */
/*  has stalled.  Matches the cryo design language with warn color.    */
/* ------------------------------------------------------------------ */

interface Props {
  staleness: StalenessInfo;
  /** Optional extra context, e.g. "Upstream API returned cached data" */
  detail?: string;
}

export function DataStaleBanner({ staleness, detail }: Props) {
  if (!staleness.isStale) return null;

  const lastUpdated = new Date(staleness.lastUpdated);
  const formattedTime = lastUpdated.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="cryo-panel border-warn/40 bg-warn/5 p-4 mb-8" role="alert">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-warn to-transparent" />
      <div className="flex items-start gap-3">
        <div className="text-warn text-lg leading-none mt-0.5" aria-hidden>
          ⚠
        </div>
        <div>
          <div className="font-[var(--font-display)] text-[0.7rem] tracking-[3px] text-warn font-bold mb-1">
            DATA COLLECTION PAUSED
          </div>
          <div className="text-[0.7rem] text-dim leading-relaxed">
            Kill count data has not updated in{" "}
            <span className="text-warn font-semibold">{staleness.ageLabel}</span>.
            Values shown are from{" "}
            <span className="text-text-body">{formattedTime}</span>.
            {detail && (
              <span className="block mt-1 text-dim/80">{detail}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact stale indicator for chart headers.
 * Shows a small "PAUSED" badge inline with the title.
 */
export function StaleChip({ staleness }: { staleness: StalenessInfo | null }) {
  if (!staleness?.isStale) return null;

  return (
    <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 text-[0.5rem] font-[var(--font-display)] tracking-[2px] text-warn border border-warn/30 bg-warn/5">
      PAUSED
    </span>
  );
}
