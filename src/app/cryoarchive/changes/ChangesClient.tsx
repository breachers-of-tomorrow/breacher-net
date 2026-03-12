"use client";

import { useState } from "react";

interface BuildEvent {
  detected_at: string;
  deployment_id: string;
  etag?: string;
  page_hash?: string;
  chunk_count: number;
  asset_count: number;
  changes: string[];
  http_status?: number;
  chunks_added?: string[];
  chunks_removed?: string[];
}

// Static build data from the original build_log.json
// This will be replaced by PostgreSQL API once the poller is running
const INITIAL_BUILDS: BuildEvent[] = [
  {
    detected_at: "2026-03-11T19:31:55Z",
    deployment_id: "dpl_7g7D8wvGDVuayN7ysUh2tjZUG2sL",
    chunk_count: 18,
    asset_count: 20,
    changes: ["Initial build snapshot"],
    http_status: 200,
  },
  {
    detected_at: "2026-03-12T04:13:28Z",
    deployment_id: "dpl_9TuVpSmR2VdYqxVKbBQ4j4HMC63e",
    chunk_count: 19,
    asset_count: 21,
    changes: [
      "Chunks changed: 19 → 19 (added 3, removed 2)",
      "Assets changed: 20 → 21",
    ],
    http_status: 200,
  },
];

export function ChangesClient() {
  const [builds] = useState<BuildEvent[]>(INITIAL_BUILDS);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const latest = builds.length > 0 ? builds[builds.length - 1] : null;

  return (
    <div>
      {/* Latest Build Banner */}
      {latest && (
        <a
          href="https://cryoarchive.systems"
          target="_blank"
          rel="noopener noreferrer"
          className="block cryo-panel p-6 mb-8 hover:border-accent transition-colors no-underline group"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-accent2" />
          <div className="flex items-center gap-4">
            <div className="text-3xl">🔄</div>
            <div className="flex-1">
              <div className="font-[var(--font-display)] text-sm tracking-[3px] text-accent glow-accent mb-1">
                WEBSITE UPDATED
              </div>
              <div className="text-sm text-foreground">
                {latest.changes.join(" • ")}
              </div>
              <div className="text-xs text-dim mt-1">
                {formatDate(latest.detected_at)}
              </div>
            </div>
            <div className="font-[var(--font-display)] text-xs tracking-[3px] text-accent2 group-hover:glow-accent2 shrink-0">
              GO CHECK IT OUT →
            </div>
          </div>
        </a>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="cryo-panel p-5 text-center">
          <div className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim mb-2">
            TOTAL CHANGES
          </div>
          <div className="font-[var(--font-display)] text-2xl font-bold text-accent glow-accent">
            {builds.length}
          </div>
        </div>
        {latest && (
          <div className="cryo-panel p-5 text-center">
            <div className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim mb-2">
              LAST CHANGE
            </div>
            <div className="text-sm text-accent">
              {formatDate(latest.detected_at)}
            </div>
          </div>
        )}
        {latest && (
          <div className="cryo-panel p-5 text-center">
            <div className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim mb-2">
              CHUNKS / ASSETS
            </div>
            <div className="text-sm text-accent">
              {latest.chunk_count} / {latest.asset_count}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="section-title">CHANGE TIMELINE</div>
      <div className="space-y-3">
        {[...builds].reverse().map((build, i) => {
          const realIdx = builds.length - 1 - i;
          const isExpanded = expandedIdx === realIdx;
          return (
            <div key={realIdx} className="cryo-panel p-5">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent to-transparent" />
              <div
                className="flex items-start gap-4 cursor-pointer"
                onClick={() =>
                  setExpandedIdx(isExpanded ? null : realIdx)
                }
              >
                <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-dim">
                      {formatDate(build.detected_at)}
                    </span>
                    <span className="text-xs text-accent font-[var(--font-display)] tracking-[2px]">
                      BUILD #{builds.length - i}
                    </span>
                  </div>
                  <div className="text-sm text-foreground">
                    {build.changes.join(" • ")}
                  </div>
                </div>
                <div className="text-dim text-sm shrink-0">
                  {isExpanded ? "▼" : "▶"}
                </div>
              </div>

              {/* Technical details */}
              {isExpanded && (
                <div className="mt-4 ml-6 pl-4 border-l border-border space-y-1 text-xs text-dim">
                  <div>
                    Deployment:{" "}
                    <span className="text-accent">{build.deployment_id}</span>
                  </div>
                  {build.page_hash && (
                    <div>
                      Page Hash:{" "}
                      <span className="text-accent">{build.page_hash}</span>
                    </div>
                  )}
                  <div>
                    Chunks: {build.chunk_count} • Assets: {build.asset_count}
                  </div>
                  {build.http_status && (
                    <div>HTTP Status: {build.http_status}</div>
                  )}
                  {build.chunks_added && build.chunks_added.length > 0 && (
                    <div className="text-accent2">
                      + {build.chunks_added.join(", ")}
                    </div>
                  )}
                  {build.chunks_removed && build.chunks_removed.length > 0 && (
                    <div className="text-danger">
                      - {build.chunks_removed.join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Note about database */}
      <div className="mt-8 text-center text-xs text-dim tracking-[2px]">
        LIVE BUILD MONITORING COMING SOON — POLLER SERVICE IN DEVELOPMENT
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  try {
    const tz = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
    })
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName")?.value;
    return (
      d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }) +
      " " +
      (tz || "")
    );
  } catch {
    return d.toLocaleString();
  }
}
