import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

const BASE_URL = "https://cryoarchive.systems";
const TOTAL_ENTRIES = 1200;

const INDEX_PASSWORD =
    process.env.CRYO_INDEX_PASSWORD ??
    "WITH PAIN AND FURY STRIKE THE STONE UNTIL ITS SECRETS BREAK WITH SILENT RAGE UPON THESE ALIEN SHORES UNTOLD FUTURES HIDE GO DEAR VIOLENT ONE TO WHAT ONCE WAS HOME BUT NOW LIES HAUNTED";

const DAC_PATH =
    process.env.CRYO_DAC_PATH ??
    join(process.cwd(), "poller", "dac", "71cc79cd-25f6-4884-8e26-4cfdddc81864.png");

const DAC_FILENAME = "71cc79cd-25f6-4884-8e26-4cfdddc81864.png";

/* ------------------------------------------------------------------ */
/*  Session caching — reuse authenticated cookie across requests       */
/* ------------------------------------------------------------------ */

let cachedCookie: string | null = null;
let cacheExpiry = 0;
const SESSION_TTL = 25 * 60 * 1000; // 25 minutes

/**
 * Perform a full DAC authentication flow.
 * session create -> DAC upload -> index password -> cookie string.
 */
async function fullAuthenticate(): Promise<string | null> {
    // Step 1: Create session
    const sessionRes = await fetch(`${BASE_URL}/api/session/create`, {
        method: "POST",
        signal: AbortSignal.timeout(15000),
    });
    if (!sessionRes.ok) return null;

    const setCookie = sessionRes.headers.get("set-cookie");
    if (!setCookie) return null;

    const cookieHeader = setCookie.split(";")[0]; // e.g. "goliath_public=eyJ..."

    // Step 2: Upload DAC
    let dacBuffer: Buffer;
    try {
        dacBuffer = await readFile(DAC_PATH);
    } catch {
        console.error("DAC file not found:", DAC_PATH);
        return null;
    }

    const formData = new FormData();
    const dacBlob = new Blob([new Uint8Array(dacBuffer)], { type: "image/png" });
    formData.append("data", dacBlob, DAC_FILENAME);

    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        body: formData,
        headers: { Cookie: cookieHeader },
        signal: AbortSignal.timeout(15000),
    });
    if (!loginRes.ok) {
        console.error("DAC login failed:", loginRes.status);
        return null;
    }

    // Merge any new cookies
    const loginCookie = loginRes.headers.get("set-cookie");
    const fullCookie = loginCookie
        ? `${cookieHeader}; ${loginCookie.split(";")[0]}`
        : cookieHeader;

    // Step 3: Index password auth
    const authRes = await fetch(`${BASE_URL}/api/indx/auth`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: fullCookie,
        },
        body: JSON.stringify({ password: INDEX_PASSWORD }),
        signal: AbortSignal.timeout(15000),
    });
    if (!authRes.ok) {
        console.error("Index auth failed:", authRes.status);
        return null;
    }

    // Merge auth cookies
    const authCookie = authRes.headers.get("set-cookie");
    return authCookie
        ? `${fullCookie}; ${authCookie.split(";")[0]}`
        : fullCookie;
}

/**
 * Try to fetch /indx with the given cookie. Returns the HTML body
 * if the page loads successfully (status 200 with content), else null.
 */
async function tryFetchIndex(cookie: string): Promise<string | null> {
    try {
        const res = await fetch(`${BASE_URL}/indx`, {
            headers: { Cookie: cookie },
            redirect: "manual",
            signal: AbortSignal.timeout(15000),
        });
        // A redirect (3xx) or non-200 means the session expired
        if (res.status !== 200) return null;
        const html = await res.text();
        // Check the page has actual RSC content (not a login/redirect page)
        if (!html.includes("slotId")) return null;
        return html;
    } catch {
        return null;
    }
}

/**
 * Get authenticated cookie — uses cache when available, falls back to
 * full re-authentication when the cached session expires.
 */
async function getAuthCookie(): Promise<string | null> {
    if (cachedCookie && Date.now() < cacheExpiry) {
        return cachedCookie;
    }
    const cookie = await fullAuthenticate();
    if (cookie) {
        cachedCookie = cookie;
        cacheExpiry = Date.now() + SESSION_TTL;
    }
    return cookie;
}

/**
 * Invalidate the cached session so the next call does a full re-auth.
 */
function invalidateSession(): void {
    cachedCookie = null;
    cacheExpiry = 0;
}

/* ------------------------------------------------------------------ */
/*  RSC payload content extraction helpers                             */
/* ------------------------------------------------------------------ */

/** In RSC payloads, JSON string delimiters use escaped quotes: \" */
const EQ = '\\"';

/** Extract a string field value from a chunk of raw RSC text */
function rscString(chunk: string, field: string): string | null {
    const marker = `${EQ}${field}${EQ}:${EQ}`;
    const start = chunk.indexOf(marker);
    if (start === -1) return null;
    const valStart = start + marker.length;
    const valEnd = chunk.indexOf(EQ, valStart);
    if (valEnd === -1) return null;
    return chunk.slice(valStart, valEnd);
}

/** Extract a numeric field value (or null) from raw RSC text */
function rscNumber(chunk: string, field: string): number | null {
    const marker = `${EQ}${field}${EQ}:`;
    const start = chunk.indexOf(marker);
    if (start === -1) return null;
    const valStart = start + marker.length;
    const tok = chunk.slice(valStart, valStart + 12).match(/^(\d+|null)/);
    if (!tok || tok[1] === "null") return null;
    return Number(tok[1]);
}

/** Unescape JS string escapes commonly found in RSC text content */
function unescapeRsc(raw: string): string {
    return raw
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\u003e/g, ">")
        .replace(/\\u003c/g, "<")
        .replace(/\\u0026/g, "&")
        .replace(/\\u0027/g, "'");
}

interface RscEntry {
    entry_id: string;
    entry_type: string;
    status: "unlocked";
    content_data: Record<string, unknown>;
}

/**
 * Parse unlocked entries from the RSC payload in authenticated HTML.
 * Extracts content data (CDN URLs, text, YouTube IDs) for each entry.
 */
function parseRscEntries(html: string): RscEntry[] {
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
    let full = "";
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
        full += match[1];
    }

    if (!full) return [];

    const entries: RscEntry[] = [];
    const seen = new Set<string>();

    const slotRegex = /slotId[^0-9]{0,10}?(\d+)[^}]{0,30}?content[^}]{0,30}?type[^a-z]{0,10}?(media|text|youtubeVideo)/gi;
    let slotMatch;

    while ((slotMatch = slotRegex.exec(full)) !== null) {
        const slotId = slotMatch[1];
        const ctype = slotMatch[2].toLowerCase();

        if (seen.has(slotId)) continue;
        seen.add(slotId);

        const entryId = `ENTRY_${slotId.padStart(4, "0")}`;
        const chunk = full.slice(slotMatch.index, slotMatch.index + 3000);
        let entryType: string;
        const contentData: Record<string, unknown> = {};

        if (ctype === "media") {
            const url = rscString(chunk, "url");
            const mime = rscString(chunk, "mimeType") ?? "";
            const alt = rscString(chunk, "alt");
            const altFilename = rscString(chunk, "alt_filename");
            const width = rscNumber(chunk, "width");
            const height = rscNumber(chunk, "height");

            if (mime.includes("image")) entryType = "IMAGE";
            else if (mime.includes("audio")) entryType = "AUDIO";
            else if (mime.includes("video")) entryType = "VIDEO";
            else entryType = "MEDIA";

            contentData.url = url;
            contentData.mimeType = mime || null;
            contentData.alt = alt;
            contentData.altFilename = altFilename;
            contentData.width = width;
            contentData.height = height;
        } else if (ctype === "text") {
            entryType = "TEXT";
            const rawText = rscString(chunk, "text");
            contentData.text = rawText ? unescapeRsc(rawText) : null;
        } else {
            // youtubeVideo
            entryType = "VIDEO";
            contentData.youtubeVideoId = rscString(chunk, "youtubeVideoId");
        }

        entries.push({ entry_id: entryId, entry_type: entryType, status: "unlocked", content_data: contentData });
    }

    return entries;
}

/**
 * GET /api/index-entries/scrape
 *
 * Authenticates with cryoarchive via DAC + password, then parses
 * the RSC payload to extract unlocked entry data.
 */
export async function GET() {
    try {
        // Try cached session first, then fall back to fresh auth
        let cookie = await getAuthCookie();
        if (!cookie) {
            return NextResponse.json(
                { error: "Failed to authenticate with cryoarchive" },
                { status: 502 }
            );
        }

        // Attempt to fetch /indx with current cookie
        let html = await tryFetchIndex(cookie);

        // If cached session expired, re-authenticate and retry once
        if (!html) {
            console.log("Cached session invalid, re-authenticating...");
            invalidateSession();
            cookie = await getAuthCookie();
            if (!cookie) {
                return NextResponse.json(
                    { error: "Re-authentication failed" },
                    { status: 502 }
                );
            }
            html = await tryFetchIndex(cookie);
        }

        if (!html) {
            return NextResponse.json(
                { error: "Failed to fetch index page after authentication" },
                { status: 502 }
            );
        }
        const unlockedEntries = parseRscEntries(html);

        // Build full entry list
        const unlockedIds = new Set(unlockedEntries.map((e) => e.entry_id));
        const now = new Date().toISOString();

        interface ParsedEntry {
            entry_id: string;
            entry_type: string | null;
            status: "locked" | "unlocked";
            first_seen: string;
            last_updated: string;
            content_data: Record<string, unknown> | null;
        }

        const entries: ParsedEntry[] = unlockedEntries.map((e) => ({
            ...e,
            first_seen: now,
            last_updated: now,
        }));

        // Add locked entries (1-indexed: Entry_1 through Entry_1200)
        for (let i = 1; i <= TOTAL_ENTRIES; i++) {
            const entryId = `ENTRY_${String(i).padStart(4, "0")}`;
            if (!unlockedIds.has(entryId)) {
                entries.push({
                    entry_id: entryId,
                    entry_type: null,
                    status: "locked",
                    first_seen: now,
                    last_updated: now,
                    content_data: null,
                });
            }
        }

        // Sort by entry ID
        entries.sort((a, b) => a.entry_id.localeCompare(b.entry_id));

        // Compute stats
        const typeCounts: Record<string, number> = {};
        for (const e of unlockedEntries) {
            typeCounts[e.entry_type] = (typeCounts[e.entry_type] ?? 0) + 1;
        }

        return NextResponse.json({
            stats: {
                total: entries.length,
                unlocked: unlockedEntries.length,
                locked: entries.length - unlockedEntries.length,
                types: {
                    IMAGE: typeCounts.IMAGE ?? 0,
                    TEXT: typeCounts.TEXT ?? 0,
                    VIDEO: typeCounts.VIDEO ?? 0,
                    AUDIO: typeCounts.AUDIO ?? 0,
                },
            },
            entries,
            fetchedAt: now,
            source: "live-scrape",
        });
    } catch (err) {
        console.error("Failed to scrape index:", err);
        return NextResponse.json(
            { error: "Failed to scrape index data" },
            { status: 500 }
        );
    }
}
