import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL, URLS } from "@/lib/urls";

export const metadata: Metadata = {
  title: "API Documentation",
  description:
    "Public API reference for breacher.net — endpoints for state, stabilization, steam player counts, builds, index entries, and health.",
  openGraph: {
    title: "API Documentation // BREACHER.NET",
    description:
      "Public REST API for cryoarchive state, stabilization, builds, and index data.",
    url: `${SITE_URL}/api-docs`,
  },
};

interface Endpoint {
  method: string;
  path: string;
  description: string;
  params?: { name: string; type: string; default?: string; description: string }[];
  responseFields: { name: string; type: string; description: string }[];
  example: string;
  cache?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/health",
    description:
      "Lightweight health check for K8s probes and uptime monitoring. Returns a simple status indicator with HTTP 200 (ok) or 503 (degraded).",
    responseFields: [
      { name: "status", type: '"ok" | "degraded"', description: "Service health — ok when DB is connected or unconfigured, degraded when DB is configured but unreachable" },
    ],
    example: `{
  "status": "ok"
}`,
  },
  {
    method: "GET",
    path: "/api/state/latest",
    description:
      "Returns the most recent cryoarchive state snapshot — kill count, ship date, sector states, and memory flags. Updated every 5 minutes by the poller.",
    responseFields: [
      { name: "data.capturedAt", type: "string (ISO 8601)", description: "When this snapshot was captured" },
      { name: "data.killCount", type: "number", description: "Current kill counter value" },
      { name: "data.shipDate", type: "string", description: "Displayed ship date" },
      { name: "data.nextUpdate", type: "string", description: "Next scheduled update time" },
      { name: "data.sectors", type: "object", description: "Sector names → status mapping" },
      { name: "data.memoryFlags", type: "object", description: "Memory flag states" },
      { name: "source", type: '"database"', description: "Data source" },
    ],
    example: `{
  "data": {
    "capturedAt": "2026-03-17T12:00:00.000Z",
    "killCount": 476291,
    "shipDate": "JUL 23 2026",
    "nextUpdate": "...",
    "sectors": { "perimeter": "active", ... },
    "memoryFlags": { ... }
  },
  "source": "database"
}`,
    cache: "60s + 30s stale-while-revalidate",
  },
  {
    method: "GET",
    path: "/api/state/history",
    description:
      "Returns historical state snapshots with kill count, sectors, and memory flags over time. Use for charts and trend analysis.",
    params: [
      { name: "limit", type: "integer", default: "100", description: "Max rows to return (max 1000)" },
      { name: "since", type: "ISO 8601 timestamp", description: "Only return snapshots after this time" },
    ],
    responseFields: [
      { name: "data", type: "array", description: "Array of state snapshot rows" },
      { name: "count", type: "number", description: "Number of rows returned" },
      { name: "source", type: '"database"', description: "Data source" },
    ],
    example: `{
  "data": [
    {
      "captured_at": "2026-03-17T12:00:00Z",
      "kill_count": 476291,
      "ship_date": "JUL 23 2026",
      "build_version": "...",
      "sectors": { ... },
      "memory_flags": { ... }
    }
  ],
  "count": 100,
  "source": "database"
}`,
    cache: "120s + 60s stale-while-revalidate",
  },
  {
    method: "GET",
    path: "/api/stabilization/latest",
    description:
      "Returns the latest camera stabilization snapshot — current stabilization levels and next stabilization time.",
    responseFields: [
      { name: "data.capturedAt", type: "string (ISO 8601)", description: "When this snapshot was captured" },
      { name: "data.cameras", type: "object", description: "Camera name → stabilization object mapping" },
      { name: "data.nextStabilization", type: "string", description: "Next stabilization event time" },
      { name: "source", type: '"database"', description: "Data source" },
    ],
    example: `{
  "data": {
    "capturedAt": "2026-03-17T12:00:00.000Z",
    "cameras": {
      "camera_01": { "level": 87.5, "status": "stable" }
    },
    "nextStabilization": "2026-03-17T13:00:00Z"
  },
  "source": "database"
}`,
    cache: "60s + 30s stale-while-revalidate",
  },
  {
    method: "GET",
    path: "/api/stabilization/history",
    description:
      "Returns historical stabilization snapshots. Use for charting camera stabilization levels over time.",
    params: [
      { name: "limit", type: "integer", default: "100", description: "Max rows to return (max 1000)" },
      { name: "since", type: "ISO 8601 timestamp", description: "Only return snapshots after this time" },
    ],
    responseFields: [
      { name: "data", type: "array", description: "Array of stabilization snapshot rows" },
      { name: "count", type: "number", description: "Number of rows returned" },
      { name: "source", type: '"database"', description: "Data source" },
    ],
    example: `{
  "data": [
    {
      "captured_at": "2026-03-17T12:00:00Z",
      "cameras": { ... },
      "next_stabilization": "2026-03-17T13:00:00Z"
    }
  ],
  "count": 100,
  "source": "database"
}`,
    cache: "120s + 60s stale-while-revalidate",
  },
  {
    method: "GET",
    path: "/api/steam",
    description:
      "Returns the current live Steam player count for Marathon. Proxies the public ISteamUserStats endpoint — no API key required.",
    responseFields: [
      { name: "playerCount", type: "number", description: "Current concurrent players on Steam" },
      { name: "appId", type: "number", description: "Steam Application ID (3065800)" },
      { name: "timestamp", type: "string (ISO 8601)", description: "Server time when fetched" },
    ],
    example: `{\n  "playerCount": 1247,\n  "appId": 3065800,\n  "timestamp": "2026-03-17T12:00:00.000Z"\n}`,
    cache: "60s + 30s stale-while-revalidate",
  },
  {
    method: "GET",
    path: "/api/steam/history",
    description:
      "Returns historical Steam player count snapshots for Marathon. Used by the player count chart for trend analysis.",
    params: [
      { name: "limit", type: "integer", default: "500", description: "Max rows to return (max 2000)" },
      { name: "since", type: "ISO 8601 timestamp", description: "Only return snapshots after this time" },
    ],
    responseFields: [
      { name: "data", type: "array", description: "Array of { captured_at, player_count } objects" },
      { name: "count", type: "number", description: "Number of rows returned" },
      { name: "source", type: '"database"', description: "Data source" },
    ],
    example: `{\n  "data": [\n    {\n      "captured_at": "2026-03-17T12:00:00Z",\n      "player_count": 1247\n    }\n  ],\n  "count": 500,\n  "source": "database"\n}`,
    cache: "120s + 60s stale-while-revalidate",
  },
  {
    method: "GET",
    path: "/api/builds/latest",
    description:
      "Returns the most recent build/deployment event detected on cryoarchive.systems.",
    responseFields: [
      { name: "data.id", type: "number", description: "Build event ID" },
      { name: "data.detected_at", type: "string (ISO 8601)", description: "When the build was detected" },
      { name: "data.build_hash", type: "string", description: "Build hash identifier" },
      { name: "data.build_version", type: "string", description: "Build version string" },
      { name: "data.summary", type: "string", description: "Human-readable summary of changes" },
      { name: "data.details", type: "object", description: "Detailed change information" },
      { name: "data.headers", type: "object", description: "HTTP headers from the build" },
      { name: "source", type: '"database"', description: "Data source" },
    ],
    example: `{
  "data": {
    "id": 42,
    "detected_at": "2026-03-17T10:30:00Z",
    "build_hash": "abc123...",
    "build_version": "1.2.3",
    "summary": "New build deployed",
    "details": { ... },
    "headers": { ... }
  },
  "source": "database"
}`,
    cache: "60s + 30s stale-while-revalidate",
  },
  {
    method: "GET",
    path: "/api/builds",
    description:
      "Returns a list of build/deployment change events in reverse chronological order.",
    params: [
      { name: "limit", type: "integer", default: "50", description: "Max rows to return (max 200)" },
    ],
    responseFields: [
      { name: "data", type: "array", description: "Array of build event objects" },
      { name: "count", type: "number", description: "Number of rows returned" },
      { name: "source", type: '"database"', description: "Data source" },
    ],
    example: `{
  "data": [
    {
      "id": 42,
      "detected_at": "2026-03-17T10:30:00Z",
      "build_hash": "abc123...",
      "build_version": "1.2.3",
      "summary": "New build deployed",
      "details": { ... },
      "headers": { ... }
    }
  ],
  "count": 50,
  "source": "database"
}`,
  },
  {
    method: "GET",
    path: "/api/index-entries",
    description:
      "Returns all cryoarchive index entries with stats summary. Supports filtering by lock status and content type. Currently tracks 1,200+ entries.",
    params: [
      { name: "status", type: '"locked" | "unlocked" | "all"', default: '"all"', description: "Filter by lock status" },
      { name: "type", type: '"IMAGE" | "TEXT" | "VIDEO" | "AUDIO"', description: "Filter by content type" },
    ],
    responseFields: [
      { name: "stats.total", type: "number", description: "Total entries in database" },
      { name: "stats.unlocked", type: "number", description: "Number of unlocked entries" },
      { name: "stats.locked", type: "number", description: "Number of locked entries" },
      { name: "stats.types", type: "object", description: "Count per type — IMAGE, TEXT, VIDEO, AUDIO, DOCUMENT, MEDIA" },
      { name: "entries", type: "array", description: "Array of index entry objects" },
      { name: "fetchedAt", type: "string (ISO 8601)", description: "When the query was executed" },
      { name: "source", type: '"database"', description: "Data source" },
    ],
    example: `{
  "stats": {
    "total": 1247,
    "unlocked": 312,
    "locked": 935,
    "types": {
      "IMAGE": 856,
      "TEXT": 203,
      "VIDEO": 47,
      "AUDIO": 89,
      "DOCUMENT": 12,
      "MEDIA": 40
    }
  },
  "entries": [
    {
      "entry_id": "IDX-0001",
      "entry_type": "IMAGE",
      "status": "unlocked",
      "first_seen": "2026-01-15T...",
      "last_updated": "2026-03-17T...",
      "content_data": { ... }
    }
  ],
  "fetchedAt": "2026-03-17T12:00:00.000Z",
  "source": "database"
}`,
    cache: "300s + 120s stale-while-revalidate",
  },
];

export default function ApiDocsPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="font-[var(--font-display)] text-2xl sm:text-4xl font-black text-accent glow-accent tracking-[6px] mb-4">
          API DOCUMENTATION
        </h1>
        <p className="text-dim text-sm sm:text-base tracking-[2px] max-w-2xl mx-auto mb-2">
          PUBLIC REST API FOR CRYOARCHIVE DATA
        </p>
        <p className="text-dim/60 text-xs tracking-[1px] max-w-xl mx-auto">
          All endpoints are read-only and publicly accessible. Data is updated every 5 minutes
          by the Python poller. No authentication required.
        </p>
      </div>

      {/* Base URL */}
      <section className="mb-8">
        <div className="section-title">BASE URL</div>
        <div className="cryo-panel p-4 sm:p-6">
          <code className="text-accent2 text-sm font-[var(--font-mono)] break-all">
            https://breacher.net
          </code>
          <p className="text-dim text-xs mt-2">
            All endpoints return JSON. Responses include a{" "}
            <code className="text-accent2 text-[0.65rem]">source</code> field indicating the data origin.
            Cloudflare caching respects the{" "}
            <code className="text-accent2 text-[0.65rem]">Cache-Control</code> headers set by each endpoint.
          </p>
        </div>
      </section>

      {/* Quick Reference */}
      <section className="mb-12">
        <div className="section-title">QUICK REFERENCE</div>
        <div className="cryo-panel overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-[var(--font-display)] text-[0.6rem] tracking-[2px] text-dim px-4 py-3">METHOD</th>
                <th className="text-left font-[var(--font-display)] text-[0.6rem] tracking-[2px] text-dim px-4 py-3">ENDPOINT</th>
                <th className="text-left font-[var(--font-display)] text-[0.6rem] tracking-[2px] text-dim px-4 py-3 hidden sm:table-cell">DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {ENDPOINTS.map((ep) => (
                <tr key={ep.path} className="border-b border-border/30 hover:bg-accent/5 transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="font-[var(--font-display)] text-[0.6rem] tracking-[1px] text-mint">
                      {ep.method}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <a href={`#${ep.path.replace(/\//g, "-").slice(1)}`} className="text-accent2 font-[var(--font-mono)] text-[0.7rem] hover:text-accent transition-colors no-underline">
                      {ep.path}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-dim hidden sm:table-cell">
                    {ep.description.split(".")[0]}.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Endpoint Details */}
      <section className="mb-12 space-y-6">
        <div className="section-title">ENDPOINT REFERENCE</div>
        {ENDPOINTS.map((ep) => (
          <EndpointCard key={ep.path} endpoint={ep} />
        ))}
      </section>

      {/* Error Responses */}
      <section className="mb-12">
        <div className="section-title">ERROR RESPONSES</div>
        <div className="cryo-panel p-6 sm:p-8 space-y-4">
          <p className="text-dim text-sm leading-relaxed">
            All endpoints return consistent error shapes:
          </p>
          <div className="space-y-3">
            <ErrorExample
              status={400}
              description="Invalid query parameter"
              body='{ "error": "Invalid limit: \\"abc\\" — must be a positive integer" }'
            />
            <ErrorExample
              status={500}
              description="Database query failed"
              body='{ "error": "Database query failed", "data": [], "source": "error" }'
            />
            <ErrorExample
              status={503}
              description="No data available (poller hasn't run)"
              body='{ "error": "No state data available yet — poller may not have run", "data": null, "source": "empty" }'
            />
          </div>
        </div>
      </section>

      {/* Rate Limiting */}
      <section className="mb-12">
        <div className="section-title">RATE LIMITING &amp; CACHING</div>
        <div className="cryo-panel p-6 sm:p-8">
          <p className="text-dim text-sm leading-relaxed mb-3">
            A sliding-window rate limiter is applied per IP, per endpoint. Cloudflare also provides
            edge-level throttling. Data updates every 5 minutes — polling faster won&apos;t get fresher data.
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-dim px-3 py-1.5 font-normal">Endpoint</th>
                  <th className="text-left text-dim px-3 py-1.5 font-normal">Limit</th>
                  <th className="text-left text-dim px-3 py-1.5 font-normal">Window</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/20">
                  <td className="px-3 py-1.5"><code className="text-accent2 text-[0.65rem]">/api/*/history</code></td>
                  <td className="px-3 py-1.5 text-dim/80">20 req</td>
                  <td className="px-3 py-1.5 text-dim/80">60s</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="px-3 py-1.5"><code className="text-accent2 text-[0.65rem]">/api/index-entries</code></td>
                  <td className="px-3 py-1.5 text-dim/80">20 req</td>
                  <td className="px-3 py-1.5 text-dim/80">60s</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="px-3 py-1.5"><code className="text-accent2 text-[0.65rem]">/api/status</code></td>
                  <td className="px-3 py-1.5 text-dim/80">10 req</td>
                  <td className="px-3 py-1.5 text-dim/80">60s</td>
                </tr>
                <tr className="border-b border-border/20">
                  <td className="px-3 py-1.5"><code className="text-accent2 text-[0.65rem]">All others</code></td>
                  <td className="px-3 py-1.5 text-dim/80">60 req</td>
                  <td className="px-3 py-1.5 text-dim/80">60s</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ul className="space-y-1.5 text-xs text-dim/80">
            <li className="flex gap-2">
              <span className="text-accent2 shrink-0">▸</span>
              <span>Responses include <code className="text-accent2 text-[0.65rem]">Cache-Control</code> headers — respect them</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent2 shrink-0">▸</span>
              <span>For bulk historical data, use the <code className="text-accent2 text-[0.65rem]">since</code> param instead of fetching everything</span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent2 shrink-0">▸</span>
              <span>If you&apos;re building a tool that polls regularly, 5-minute intervals are ideal</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Bottom nav */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/contribute"
          className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-accent/10 border border-accent text-accent hover:bg-accent/20 transition-colors no-underline"
        >
          CONTRIBUTE →
        </Link>
        <a
          href={URLS.breacherNetRepo}
          target="_blank"
          rel="noopener noreferrer"
          className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-panel border border-border text-dim hover:text-foreground hover:border-accent transition-colors no-underline"
        >
          SOURCE CODE →
        </a>
      </div>
    </main>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const anchorId = endpoint.path.replace(/\//g, "-").slice(1);

  return (
    <div id={anchorId} className="cryo-panel p-6 sm:p-8 scroll-mt-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="font-[var(--font-display)] text-[0.65rem] tracking-[2px] px-2.5 py-1 bg-mint/10 border border-mint/30 text-mint">
          {endpoint.method}
        </span>
        <code className="font-[var(--font-mono)] text-sm text-accent2 break-all">
          {endpoint.path}
        </code>
        {endpoint.cache && (
          <span className="font-[var(--font-display)] text-[0.55rem] tracking-[1px] px-2 py-0.5 bg-accent/5 border border-border text-dim ml-auto">
            CACHE: {endpoint.cache}
          </span>
        )}
      </div>

      <p className="text-dim text-sm leading-relaxed mb-4">{endpoint.description}</p>

      {/* Query Parameters */}
      {endpoint.params && endpoint.params.length > 0 && (
        <div className="mb-4">
          <h4 className="font-[var(--font-display)] text-[0.6rem] tracking-[2px] text-dim mb-2">
            QUERY PARAMETERS
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-dim px-3 py-1.5 font-normal">Name</th>
                  <th className="text-left text-dim px-3 py-1.5 font-normal">Type</th>
                  <th className="text-left text-dim px-3 py-1.5 font-normal hidden sm:table-cell">Default</th>
                  <th className="text-left text-dim px-3 py-1.5 font-normal">Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoint.params.map((p) => (
                  <tr key={p.name} className="border-b border-border/20">
                    <td className="px-3 py-1.5">
                      <code className="text-accent2 text-[0.65rem]">{p.name}</code>
                    </td>
                    <td className="px-3 py-1.5 text-dim/80 font-[var(--font-mono)] text-[0.6rem]">{p.type}</td>
                    <td className="px-3 py-1.5 text-dim/60 hidden sm:table-cell">{p.default ?? "—"}</td>
                    <td className="px-3 py-1.5 text-dim/80">{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Response Fields */}
      <div className="mb-4">
        <h4 className="font-[var(--font-display)] text-[0.6rem] tracking-[2px] text-dim mb-2">
          RESPONSE FIELDS
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-dim px-3 py-1.5 font-normal">Field</th>
                <th className="text-left text-dim px-3 py-1.5 font-normal">Type</th>
                <th className="text-left text-dim px-3 py-1.5 font-normal">Description</th>
              </tr>
            </thead>
            <tbody>
              {endpoint.responseFields.map((f) => (
                <tr key={f.name} className="border-b border-border/20">
                  <td className="px-3 py-1.5">
                    <code className="text-accent2 text-[0.65rem]">{f.name}</code>
                  </td>
                  <td className="px-3 py-1.5 text-dim/80 font-[var(--font-mono)] text-[0.6rem] whitespace-nowrap">{f.type}</td>
                  <td className="px-3 py-1.5 text-dim/80">{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Example Response */}
      <div>
        <h4 className="font-[var(--font-display)] text-[0.6rem] tracking-[2px] text-dim mb-2">
          EXAMPLE RESPONSE
        </h4>
        <pre className="bg-background/80 border border-border/50 p-4 overflow-x-auto text-[0.7rem] leading-relaxed">
          <code className="text-dim/80">{endpoint.example}</code>
        </pre>
      </div>
    </div>
  );
}

function ErrorExample({
  status,
  description,
  body,
}: {
  status: number;
  description: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="font-[var(--font-display)] text-[0.65rem] tracking-[1px] px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 shrink-0 mt-0.5">
        {status}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-foreground text-xs mb-1">{description}</div>
        <pre className="text-[0.65rem] text-dim/60 overflow-x-auto">
          <code>{body}</code>
        </pre>
      </div>
    </div>
  );
}
