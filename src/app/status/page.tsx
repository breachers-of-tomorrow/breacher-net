import type { Metadata } from "next";
import { SITE_URL } from "@/lib/urls";
import { getPool } from "@/lib/db";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Status",
  description:
    "Infrastructure health and data freshness for breacher.net — database status, poller activity, and upstream API availability.",
  openGraph: {
    title: "Status // BREACHER.NET",
    description:
      "Infrastructure health and data freshness for breacher.net.",
    url: `${SITE_URL}/status`,
  },
};

interface FreshnessEntry {
  table: string;
  label: string;
  lastUpdated: string | null;
}

interface PollerEntry {
  pollerName: string;
  heartbeatAt: string;
  status: string;
  details: string | null;
}

interface StatusResponse {
  status: string;
  timestamp: string;
  database: {
    connected: boolean;
  };
  freshness: FreshnessEntry[];
  pollers: PollerEntry[];
}

/** How many minutes old data can be before it's considered stale. */
const STALE_THRESHOLDS: Record<string, number> = {
  state_snapshots: 20, // 15m poll + buffer
  stabilization_snapshots: 20,
  steam_snapshots: 20,
  build_events: 1440, // builds only when site changes — 24h is fine
  index_entries: 20,
  index_snapshots: 20,
};

function getFreshnessStatus(
  table: string,
  lastUpdated: string | null,
): "healthy" | "stale" | "empty" {
  if (!lastUpdated) return "empty";
  const ageMinutes =
    (Date.now() - new Date(lastUpdated).getTime()) / 1000 / 60;
  const threshold = STALE_THRESHOLDS[table] ?? 30;
  return ageMinutes > threshold ? "stale" : "healthy";
}

function formatAge(isoDate: string | null): string {
  if (!isoDate) return "No data";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ${diffMin % 60}m ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ${diffHrs % 24}h ago`;
}

function StatusIndicator({
  health,
}: {
  health: "healthy" | "stale" | "empty" | "degraded";
}) {
  const colors: Record<string, string> = {
    healthy: "bg-mint/80 shadow-[0_0_6px_var(--color-mint)]",
    stale: "bg-cryo-warn/80 shadow-[0_0_6px_var(--color-cryo-warn)]",
    empty: "bg-cryo-dim/40",
    degraded: "bg-cryo-danger/80 shadow-[0_0_6px_var(--color-cryo-danger)]",
  };

  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${colors[health] ?? colors.empty}`}
      role="status"
      aria-label={health}
    />
  );
}

async function getStatusData(): Promise<StatusResponse | null> {
  const db = getPool();
  if (!db) {
    return {
      status: "standalone",
      timestamp: new Date().toISOString(),
      database: { connected: false },
      freshness: [],
      pollers: [],
    };
  }

  let dbConnected = false;
  const freshness: FreshnessEntry[] = [];
  const pollers: PollerEntry[] = [];

  try {
    await db.query("SELECT 1");
    dbConnected = true;

    const freshnessQueries = [
      { table: "state_snapshots", label: "State Poller", sql: "SELECT MAX(captured_at) AS last_updated FROM state_snapshots" },
      { table: "stabilization_snapshots", label: "Stabilization Data", sql: "SELECT MAX(captured_at) AS last_updated FROM stabilization_snapshots" },
      { table: "steam_snapshots", label: "Steam Player Data", sql: "SELECT MAX(captured_at) AS last_updated FROM steam_snapshots" },
      { table: "build_events", label: "Build Tracker", sql: "SELECT MAX(detected_at) AS last_updated FROM build_events" },
      { table: "index_entries", label: "Index Archive", sql: "SELECT MAX(last_updated) AS last_updated FROM index_entries" },
      { table: "index_snapshots", label: "Index Snapshots", sql: "SELECT MAX(captured_at) AS last_updated FROM index_snapshots" },
    ];

    for (const q of freshnessQueries) {
      try {
        const result = await db.query(q.sql);
        const row = result.rows[0];
        freshness.push({
          table: q.table,
          label: q.label,
          lastUpdated: row?.last_updated?.toISOString() ?? null,
        });
      } catch {
        freshness.push({ table: q.table, label: q.label, lastUpdated: null });
      }
    }

    try {
      const heartbeatResult = await db.query(
        "SELECT poller_name, heartbeat_at, status, details FROM poller_heartbeats ORDER BY heartbeat_at DESC LIMIT 10",
      );
      for (const row of heartbeatResult.rows) {
        pollers.push({
          pollerName: row.poller_name,
          heartbeatAt: row.heartbeat_at?.toISOString(),
          status: row.status,
          details: row.details,
        });
      }
    } catch {
      // poller_heartbeats table may not exist yet
    }
  } catch {
    dbConnected = false;
  }

  return {
    status: dbConnected ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    database: { connected: dbConnected },
    freshness,
    pollers,
  };
}

export default async function StatusPage() {
  const data = await getStatusData();

  const overallHealth = data?.status ?? "unknown";
  const overallLabel: Record<string, string> = {
    healthy: "ALL SYSTEMS OPERATIONAL",
    degraded: "DEGRADED PERFORMANCE",
    standalone: "STANDALONE MODE",
    unknown: "STATUS UNAVAILABLE",
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="font-[var(--font-display)] text-2xl sm:text-4xl font-black text-accent glow-accent tracking-[6px] mb-4">
          SYSTEM STATUS
        </h1>
        <p className="text-dim text-sm sm:text-base tracking-[2px] max-w-2xl mx-auto">
          INFRASTRUCTURE HEALTH AND DATA FRESHNESS
        </p>
      </div>

      {/* Overall Status */}
      <section className="mb-12">
        <div className="cryo-panel p-6 sm:p-8 flex items-center gap-4">
          <StatusIndicator
            health={
              overallHealth === "healthy"
                ? "healthy"
                : overallHealth === "degraded"
                  ? "degraded"
                  : "empty"
            }
          />
          <div>
            <div className="font-[var(--font-display)] text-sm tracking-[3px] text-heading">
              {overallLabel[overallHealth] ?? "UNKNOWN"}
            </div>
            {data && (
              <div className="text-xs text-dim mt-1">
                Last checked:{" "}
                {new Date(data.timestamp).toLocaleString("en-US", {
                  timeZoneName: "short",
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Database */}
      <section className="mb-12">
        <div className="section-title">DATABASE</div>
        <div className="cryo-panel p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <StatusIndicator
              health={
                data?.database.connected ? "healthy" : "degraded"
              }
            />
            <span className="font-[var(--font-display)] text-xs tracking-[2px] text-heading">
              {data?.database.connected ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>
        </div>
      </section>

      {/* Data Freshness */}
      <section className="mb-12">
        <div className="section-title">DATA FRESHNESS</div>
        <div className="space-y-3">
          {data?.freshness && data.freshness.length > 0 ? (
            data.freshness.map((entry) => {
              const health = getFreshnessStatus(
                entry.table,
                entry.lastUpdated,
              );
              return (
                <div
                  key={entry.table}
                  className="cryo-panel p-4 sm:p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusIndicator health={health} />
                    <div className="min-w-0">
                      <div className="font-[var(--font-display)] text-xs tracking-[2px] text-heading truncate">
                        {entry.label.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs ${health === "healthy" ? "text-mint" : health === "stale" ? "text-cryo-warn" : "text-dim"}`}
                    >
                      {formatAge(entry.lastUpdated)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="cryo-panel p-6 text-center text-dim text-sm">
              {data
                ? "No data tables available"
                : "Unable to fetch status data"}
            </div>
          )}
        </div>
      </section>

      {/* Poller Heartbeats */}
      {data?.pollers && data.pollers.length > 0 && (
        <section className="mb-12">
          <div className="section-title">POLLER HEARTBEATS</div>
          <div className="space-y-3">
            {data.pollers.map((p, i) => (
              <div
                key={`${p.pollerName}-${i}`}
                className="cryo-panel p-4 sm:p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusIndicator
                    health={p.status === "ok" ? "healthy" : "stale"}
                  />
                  <div className="font-[var(--font-display)] text-xs tracking-[2px] text-heading truncate">
                    {p.pollerName.toUpperCase()}
                  </div>
                </div>
                <div className="text-xs text-dim">
                  {formatAge(p.heartbeatAt)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Info */}
      <section className="mb-12">
        <div className="section-title">ABOUT THIS PAGE</div>
        <div className="cryo-panel p-6 sm:p-8 text-sm text-dim space-y-2">
          <p>
            This page auto-refreshes every 60 seconds. Data freshness
            indicators show how recently each poller stored data in the
            database.
          </p>
          <p>
            <span className="inline-flex items-center gap-1.5">
              <StatusIndicator health="healthy" />
              <span>Healthy</span>
            </span>
            {" · "}
            <span className="inline-flex items-center gap-1.5">
              <StatusIndicator health="stale" />
              <span>Stale</span>
            </span>
            {" · "}
            <span className="inline-flex items-center gap-1.5">
              <StatusIndicator health="empty" />
              <span>No data</span>
            </span>
            {" · "}
            <span className="inline-flex items-center gap-1.5">
              <StatusIndicator health="degraded" />
              <span>Error</span>
            </span>
          </p>
        </div>
      </section>
    </main>
  );
}
