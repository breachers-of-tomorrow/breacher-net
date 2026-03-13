"use client";

import { useEffect, useState } from "react";

interface BuildEvent {
  detected_at: string;
  build_hash?: string;
  summary?: string;
  details?: Record<string, unknown>;
  headers?: Record<string, string>;
  // Legacy fields from static data
  deployment_id?: string;
  chunk_count?: number;
  asset_count?: number;
  changes?: string[];
  http_status?: number;
  chunks_added?: string[];
  chunks_removed?: string[];
}

// Static build data — shown when no database is available
const FALLBACK_BUILDS: BuildEvent[] = [
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

const BUILDS_API = "/api/builds";
const REFRESH_INTERVAL = 5 * 60_000; // 5 minutes

export function ChangesClient() {
  const [builds, setBuilds] = useState<BuildEvent[]>(FALLBACK_BUILDS);
  const [source, setSource] = useState<string>("static");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Fetch on mount + periodic refresh
  useEffect(() => {
    let cancelled = false;

    const doFetch = async () => {
      try {
        const res = await fetch(`${BUILDS_API}?limit=100&t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (!cancelled && json.source === "database" && json.data?.length > 0) {
          setBuilds(json.data);
          setSource("database");
        }
      } catch {
        // Keep static data on error
      }
    };

    doFetch();
    const interval = setInterval(doFetch, REFRESH_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Sort builds oldest-first for display (timeline is reversed below)
  const sortedBuilds = [...builds].sort(
    (a, b) =>
      new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime()
  );

  const latest =
    sortedBuilds.length > 0 ? sortedBuilds[sortedBuilds.length - 1] : null;

  return (
    <div>
      {/* Source indicator */}
      <div className="flex items-center gap-2 mb-6 text-xs text-dim">
        <span className="font-[var(--font-display)] tracking-[3px]">
          DATA SOURCE:
        </span>
        <span className={source === "database" ? "text-accent2" : "text-warn"}>
          {source === "database" ? "LIVE DATABASE" : "STATIC SNAPSHOT"}
        </span>
      </div>

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
                {getBuildDescription(latest)}
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
            {sortedBuilds.length}
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
              IDENTIFIER
            </div>
            <div className="text-sm text-accent font-mono">
              {latest.build_hash
                ? latest.build_hash.slice(0, 12)
                : latest.deployment_id
                  ? latest.deployment_id.slice(0, 16)
                  : "--"}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="section-title">CHANGE TIMELINE</div>
      <div className="space-y-3">
        {[...sortedBuilds].reverse().map((build, i) => {
          const realIdx = sortedBuilds.length - 1 - i;
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
                      BUILD #{sortedBuilds.length - i}
                    </span>
                  </div>
                  <div className="text-sm text-foreground">
                    {getBuildDescription(build)}
                  </div>
                </div>
                <div className="text-dim text-sm shrink-0">
                  {isExpanded ? "▼" : "▶"}
                </div>
              </div>

              {/* Technical details */}
              {isExpanded && (
                <div className="mt-4 ml-6 pl-4 border-l border-border space-y-1 text-xs text-dim">
                  {build.build_hash && (
                    <div>
                      Build Hash:{" "}
                      <span className="text-accent font-mono">
                        {build.build_hash}
                      </span>
                    </div>
                  )}
                  {build.deployment_id && (
                    <div>
                      Deployment:{" "}
                      <span className="text-accent">
                        {build.deployment_id}
                      </span>
                    </div>
                  )}
                  {build.chunk_count != null && (
                    <div>
                      Chunks: {build.chunk_count} • Assets:{" "}
                      {build.asset_count}
                    </div>
                  )}
                  {build.http_status && (
                    <div>HTTP Status: {build.http_status}</div>
                  )}
                  {build.details && (
                    <div className="mt-1">
                      {Object.entries(
                        build.details as Record<string, unknown>
                      ).map(([k, v]) => (
                        <div key={k}>
                          <span className="text-dim/70">{k}:</span>{" "}
                          <span className="text-accent/70">
                            {String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {build.chunks_added &&
                    build.chunks_added.length > 0 && (
                      <div className="text-accent2">
                        + {build.chunks_added.join(", ")}
                      </div>
                    )}
                  {build.chunks_removed &&
                    build.chunks_removed.length > 0 && (
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

      {source !== "database" && (
        <div className="mt-8 text-center text-xs text-dim tracking-[2px]">
          LIVE BUILD MONITORING AVAILABLE WITH DATABASE — RUN WITH DOCKER
          COMPOSE
        </div>
      )}
    </div>
  );
}

function getBuildDescription(build: BuildEvent): string {
  if (build.summary) return build.summary;
  if (build.changes && build.changes.length > 0)
    return build.changes.join(" • ");
  return "Build change detected";
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
