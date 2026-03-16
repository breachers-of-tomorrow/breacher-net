import { getPool } from "@/lib/db";
import { SITE_URL } from "@/lib/urls";

/**
 * GET /feed.xml
 *
 * RSS 2.0 feed combining build events and index unlocks.
 * Auto-discoverable via <link rel="alternate"> in the root layout.
 *
 * Revalidates every 10 minutes (matches poller cadence).
 */
export const revalidate = 600;

interface BuildRow {
  id: string;
  detected_at: string;
  build_hash: string;
  build_version: string | null;
  summary: string | null;
  diff_summary: string | null;
}

interface IndexRow {
  entry_id: string;
  entry_type: string;
  last_updated: string;
  content_data: Record<string, unknown> | null;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(iso: string): string {
  return new Date(iso).toUTCString();
}

function buildItemXml(build: BuildRow): string {
  const title = build.summary
    ? escapeXml(build.summary)
    : `Build ${escapeXml(build.build_version ?? build.build_hash.slice(0, 12))} detected`;

  const desc = [
    build.build_version && `Version: ${build.build_version}`,
    build.diff_summary && build.diff_summary,
    `Hash: ${build.build_hash}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `    <item>
      <title>${title}</title>
      <link>${escapeXml(SITE_URL)}/cryoarchive/changes</link>
      <guid isPermaLink="false">build-${escapeXml(build.build_hash)}</guid>
      <pubDate>${toRfc822(build.detected_at)}</pubDate>
      <category>Build</category>
      <description>${escapeXml(desc)}</description>
    </item>`;
}

function indexItemXml(entry: IndexRow): string {
  const typeLabel = entry.entry_type ?? "UNKNOWN";
  const title = `Index entry ${entry.entry_id} unlocked (${typeLabel})`;
  const desc = `Entry ${entry.entry_id} of type ${typeLabel} was unlocked in the cryoarchive index.`;

  return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(SITE_URL)}/cryoarchive/index</link>
      <guid isPermaLink="false">index-${escapeXml(entry.entry_id)}</guid>
      <pubDate>${toRfc822(entry.last_updated)}</pubDate>
      <category>Index</category>
      <description>${escapeXml(desc)}</description>
    </item>`;
}

export async function GET() {
  const db = getPool();

  let items: string[] = [];

  if (db) {
    try {
      const [builds, unlocks] = await Promise.all([
        db.query<BuildRow>(
          `SELECT id, detected_at, build_hash, build_version, summary, diff_summary
           FROM build_events
           ORDER BY detected_at DESC
           LIMIT 30`
        ),
        db.query<IndexRow>(
          `SELECT entry_id, entry_type, last_updated, content_data
           FROM index_entries
           WHERE status = 'unlocked'
           ORDER BY last_updated DESC
           LIMIT 20`
        ),
      ]);

      const buildItems = builds.rows.map(buildItemXml);
      const indexItems = unlocks.rows.map(indexItemXml);

      // Merge and sort by date descending
      const allItems = [
        ...builds.rows.map((b, i) => ({
          date: new Date(b.detected_at),
          xml: buildItems[i],
        })),
        ...unlocks.rows.map((e, i) => ({
          date: new Date(e.last_updated),
          xml: indexItems[i],
        })),
      ];
      allItems.sort((a, b) => b.date.getTime() - a.date.getTime());
      items = allItems.slice(0, 40).map((x) => x.xml);
    } catch (err) {
      console.error("RSS feed query failed:", err);
    }
  }

  const lastBuildDate = items.length > 0 ? new Date().toUTCString() : "";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BREACHER.NET — Cryoarchive Tracker</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>Build events, index unlocks, and changes tracked at cryoarchive.systems by the Breachers of Tomorrow community.</description>
    <language>en-us</language>
    <atom:link href="${escapeXml(SITE_URL)}/feed.xml" rel="self" type="application/rss+xml"/>
${lastBuildDate ? `    <lastBuildDate>${lastBuildDate}</lastBuildDate>` : ""}
    <ttl>10</ttl>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}
