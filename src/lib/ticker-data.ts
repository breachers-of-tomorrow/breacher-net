// ============================================================
// Ticker data aggregator — assembles dynamic + static messages
// for the scrolling status ticker.
//
// Dynamic sources (graceful degradation — skipped on failure):
//  ▸ Steam player count  (public API, 5m cache)
//  ▸ Discord presence     (invite API, 5m cache)
//  ▸ Cryoarchive state    (local DB — kill count, sectors)
//  ▸ Data freshness       (local DB — last sync timestamp)
//
// Static in-universe flavor messages fill the gaps.
// ============================================================

import { fetchSteamPlayerCount } from "./api";
import { fetchDiscordPresence } from "./discord";
import { getPool } from "./db";

/** A single ticker message with optional visual "class" hint */
export interface TickerMessage {
    text: string;
    /** Optional: "live" = pulsing dot prefix, "static" = no prefix */
    kind: "live" | "static";
}

// ---- Static in-universe flavor ----

const STATIC_MESSAGES: TickerMessage[] = [
    { text: "SYS.KERNEL — NETWORK MESH STABLE", kind: "static" },
    { text: "UPLINK — BREACHER RELAY ACTIVE", kind: "static" },
    { text: "SEC.STATUS — PERIMETER INTEGRITY 100%", kind: "static" },
    { text: "TRANSIT — JUMP CORRIDOR ALIGNED", kind: "static" },
];

// ---- Dynamic message builders ----

function steamMessage(count: number): TickerMessage {
    return { text: `STEAM — ${count.toLocaleString()} OPERATORS ACTIVE`, kind: "live" };
}

function discordOnlineMessage(online: number): TickerMessage {
    return { text: `COMM.RELAY — ${online.toLocaleString()} BREACHERS ONLINE`, kind: "live" };
}

function discordMembersMessage(members: number): TickerMessage {
    return { text: `NETWORK — ${members.toLocaleString()} REGISTERED OPERATORS`, kind: "live" };
}

function killCountMessage(count: number): TickerMessage {
    return { text: `UESC — KILL COUNT ${count.toLocaleString()}`, kind: "live" };
}

function sectorsMessage(active: number, total: number): TickerMessage {
    return { text: `CRYOARCHIVE — ${active}/${total} SECTORS ACTIVE`, kind: "live" };
}

function freshnessMessage(minutesAgo: number): TickerMessage {
    const label = minutesAgo < 1 ? "JUST NOW" : `${minutesAgo}m AGO`;
    return { text: `DATA FEED — LAST SYNC ${label}`, kind: "live" };
}

function chronoMessage(): TickerMessage {
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");
    const h = String(now.getUTCHours()).padStart(2, "0");
    const min = String(now.getUTCMinutes()).padStart(2, "0");
    return { text: `CHRONO — ${y}.${m}.${d} // ${h}:${min} UTC`, kind: "static" };
}

// ---- DB helpers (non-critical, swallowed on failure) ----

async function fetchKillCount(): Promise<number | null> {
    const pool = getPool();
    if (!pool) return null;
    try {
        const result = await pool.query(
            "SELECT kill_count FROM state_snapshots ORDER BY kill_count DESC LIMIT 1",
        );
        return result.rows[0]?.kill_count ?? null;
    } catch {
        return null;
    }
}

async function fetchActiveSectors(): Promise<{ active: number; total: number } | null> {
    const pool = getPool();
    if (!pool) return null;
    try {
        const result = await pool.query(
            "SELECT raw_response FROM state_snapshots ORDER BY kill_count DESC LIMIT 1",
        );
        const state = result.rows[0]?.raw_response?.state;
        if (!state?.pages) return null;
        const pages = state.pages as Record<string, { unlocked: boolean }>;
        const entries = Object.values(pages);
        const active = entries.filter((p) => p.unlocked).length;
        return { active, total: entries.length };
    } catch {
        return null;
    }
}

async function fetchLastSyncMinutes(): Promise<number | null> {
    const pool = getPool();
    if (!pool) return null;
    try {
        const result = await pool.query(
            "SELECT MAX(captured_at) AS last_updated FROM state_snapshots",
        );
        const lastUpdated = result.rows[0]?.last_updated;
        if (!lastUpdated) return null;
        return Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60_000);
    } catch {
        return null;
    }
}

// ---- Public aggregator ----

/**
 * Fetch all available dynamic data and assemble the ticker
 * message list.  Failures are silently skipped — the ticker
 * always has at least the static messages + chrono.
 *
 * Messages are ordered: live dynamic → chrono → static flavor.
 */
export async function fetchTickerMessages(): Promise<TickerMessage[]> {
    // Fire all fetches concurrently — none depend on each other
    const [steam, discord, killCount, sectors, syncMinutes] = await Promise.all([
        fetchSteamPlayerCount(),
        fetchDiscordPresence(),
        fetchKillCount(),
        fetchActiveSectors(),
        fetchLastSyncMinutes(),
    ]);

    const messages: TickerMessage[] = [];

    // Dynamic (live) messages — only added when data is available
    if (steam !== null) messages.push(steamMessage(steam));
    if (discord) messages.push(discordOnlineMessage(discord.online));
    if (discord) messages.push(discordMembersMessage(discord.members));
    if (killCount !== null) messages.push(killCountMessage(killCount));
    if (sectors) messages.push(sectorsMessage(sectors.active, sectors.total));
    if (syncMinutes !== null) messages.push(freshnessMessage(syncMinutes));

    // Always-available messages
    messages.push(chronoMessage());

    // Static flavor
    messages.push(...STATIC_MESSAGES);

    return messages;
}
