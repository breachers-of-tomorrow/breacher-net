"use client";

import { useEffect, useState, useCallback } from "react";
import { URLS, youtubeEmbed } from "@/lib/urls";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface IndexStats {
    total: number;
    unlocked: number;
    locked: number;
    types: {
        IMAGE: number;
        TEXT: number;
        VIDEO: number;
        AUDIO: number;
        DOCUMENT: number;
        MEDIA: number;
    };
}

interface IndexEntry {
    entry_id: string;
    entry_type: string | null;
    status: "locked" | "unlocked";
    first_seen: string;
    last_updated: string;
    content_data?: EntryContentData | null;
}

interface EntryContentData {
    url?: string;
    mimeType?: string;
    alt?: string;
    altFilename?: string;
    width?: number | null;
    height?: number | null;
    text?: string;
    youtubeVideoId?: string;
}

interface IndexApiResponse {
    stats: IndexStats;
    entries: IndexEntry[];
    fetchedAt: string;
    source?: "database" | "live-scrape";
}

type FilterTab = "all" | "unlocked" | "new" | "IMAGE" | "TEXT" | "VIDEO" | "AUDIO" | "DOCUMENT" | "MEDIA";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const INDEX_URL = URLS.cryoarchiveIndex;
const API_URL = "/api/index-entries";
const REFRESH_INTERVAL = 300_000; // 5 minutes
const NEW_ENTRY_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Check if an entry is "new" — unlocked within the last 6 hours.
 * Uses `last_updated` when the entry transitioned to unlocked.
 */
function isNewEntry(entry: IndexEntry): boolean {
    if (entry.status !== "unlocked") return false;
    const updated = new Date(entry.last_updated).getTime();
    return Date.now() - updated < NEW_ENTRY_WINDOW_MS;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function IndexArchiveClient() {
    const [data, setData] = useState<IndexApiResponse | null>(null);
    const [filter, setFilter] = useState<FilterTab>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Fetch from DB-backed API only — no live scrape fallback
    const fetchData = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}?t=${Date.now()}`, { cache: "no-store" });
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            const json = await res.json();
            setData(json);
            setError(null);
        } catch (err) {
            setError("Failed to load index data");
            console.error("Index fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, REFRESH_INTERVAL);
        return () => clearInterval(id);
    }, [fetchData]);

    // Derived state
    const stats = data?.stats;
    const newCount = data?.entries.filter(isNewEntry).length ?? 0;

    const filteredEntries = data?.entries.filter((e) => {
        if (filter === "all") return true;
        if (filter === "unlocked") return e.status === "unlocked";
        if (filter === "new") return isNewEntry(e);
        return e.entry_type === filter;
    }) ?? [];

    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-black text-accent glow-accent tracking-[4px] mb-2">
                    INDEX ARCHIVE
                </h1>
                <p className="text-dim text-sm tracking-[2px]">
                    SVX FOR{" "}
                    <a
                        href={INDEX_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent2 hover:glow-accent2"
                    >
                        CRYOARCHIVE.SYSTEMS/INDX
                    </a>
                </p>
            </div>

            {/* Loading */}
            {loading && (
                <div className="cryo-panel p-12 text-center">
                    <div className="text-accent glow-accent animate-pulse-slow text-lg tracking-[4px]">
                        SCANNING INDEX...
                    </div>
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div className="cryo-panel p-8 text-center border-danger/30">
                    <div className="text-danger glow-danger mb-2">{error}</div>
                    <button
                        onClick={() => { setLoading(true); fetchData(); }}
                        className="text-accent text-xs tracking-[2px] hover:glow-accent"
                    >
                        RETRY
                    </button>
                </div>
            )}

            {/* Data loaded */}
            {stats && !loading && (
                <>
                    {/* Stats Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
                        <StatCard label="TOTAL ENTRIES" value={stats.total} color="text-foreground" />
                        <StatCard label="UNLOCKED" value={stats.unlocked} color="text-mint glow-mint" />
                        <StatCard label="NEW" value={newCount} color="text-warn glow-warn" pulse={newCount > 0} />
                        <StatCard label="LOCKED" value={stats.locked} color="text-dim" />
                        <StatCard label="IMAGE" value={stats.types.IMAGE} color="text-accent2 glow-accent2" />
                        <StatCard label="TEXT" value={stats.types.TEXT} color="text-accent glow-accent" />
                        <StatCard label="VIDEO" value={stats.types.VIDEO} color="text-warn glow-warn" />
                        <StatCard label="AUDIO" value={stats.types.AUDIO} color="text-danger glow-danger" />
                        {stats.types.DOCUMENT > 0 && (
                            <StatCard label="DOCUMENT" value={stats.types.DOCUMENT} color="text-purple-400 glow-accent" />
                        )}
                        {stats.types.MEDIA > 0 && (
                            <StatCard label="MEDIA" value={stats.types.MEDIA} color="text-dim" />
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {(["all", "unlocked", "new", "IMAGE", "TEXT", "VIDEO", "AUDIO", "DOCUMENT", "MEDIA"] as FilterTab[]).map((tab) => {
                            const isActive = filter === tab;
                            const count = tab === "all"
                                ? stats.total
                                : tab === "unlocked"
                                    ? stats.unlocked
                                    : tab === "new"
                                        ? newCount
                                        : stats.types[tab as keyof typeof stats.types] ?? 0;
                            // Hide DOCUMENT and MEDIA tabs when count is 0
                            if ((tab === "DOCUMENT" || tab === "MEDIA") && count === 0) return null;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    className={`
                    font-[var(--font-display)] text-[0.6rem] tracking-[2px] uppercase
                    px-3 py-1.5 border transition-all
                    ${isActive
                                            ? "text-accent border-accent bg-accent/10 glow-accent"
                                            : "text-dim border-border hover:text-foreground hover:border-accent/40"
                                        }
                  `}
                                >
                                    {tab} ({count})
                                </button>
                            );
                        })}
                    </div>

                    {/* Entry List */}
                    <div className="cryo-panel">
                        <div className="p-4 border-b border-border">
                            <div className="font-[var(--font-display)] text-[0.6rem] tracking-[3px] text-dim">
                                CRYOARCHIVE ENTRY INDEX — {filteredEntries.length} ENTRIES
                            </div>
                        </div>
                        <div className="max-h-[80vh] overflow-y-auto">
                            <div className="p-4 text-xs font-[var(--font-mono)]">
                                {filteredEntries.length === 0 ? (
                                    <div className="text-dim">No entries match filter.</div>
                                ) : (
                                    filteredEntries.map((entry) => (
                                        <EntryRow
                                            key={entry.entry_id}
                                            entry={entry}
                                            isNew={isNewEntry(entry)}
                                            isExpanded={expanded.has(entry.entry_id)}
                                            onToggle={() => toggleExpand(entry.entry_id)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer info */}
                    <div className="mt-4 text-center text-[0.6rem] tracking-[2px] text-dim">
                        {data?.fetchedAt && (
                            <span>LAST UPDATED: {new Date(data.fetchedAt).toLocaleString()}</span>
                        )}
                    </div>
                </>
            )}
        </main>
    );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, color, pulse }: { label: string; value: number; color: string; pulse?: boolean }) {
    return (
        <div className={`cryo-panel p-3 text-center ${pulse ? "animate-pulse-slow" : ""}`}>
            <div className="font-[var(--font-display)] text-[0.55rem] tracking-[2px] text-dim mb-1">
                {label}
            </div>
            <div className={`font-[var(--font-display)] text-lg font-bold ${color}`}>
                {value.toLocaleString()}
            </div>
        </div>
    );
}

const TYPE_COLORS: Record<string, string> = {
    IMAGE: "text-accent2",
    TEXT: "text-accent",
    VIDEO: "text-warn",
    AUDIO: "text-danger",
    DOCUMENT: "text-purple-400",
    MEDIA: "text-dim",
};

function EntryRow({ entry, isNew, isExpanded, onToggle }: {
    entry: IndexEntry;
    isNew: boolean;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    if (entry.status === "locked") {
        return (
            <div className="text-dim/30 leading-relaxed select-none">
                {entry.entry_id} — LOCKED
            </div>
        );
    }

    const typeColor = TYPE_COLORS[entry.entry_type ?? ""] ?? "text-foreground";
    const cd = entry.content_data;
    const hasContent = !!cd && !!(cd.url || cd.text || cd.youtubeVideoId);

    return (
        <div>
            <button
                type="button"
                onClick={hasContent ? onToggle : undefined}
                className={`w-full text-left py-1 flex items-center leading-relaxed transition-colors ${hasContent ? "hover:bg-accent/5 cursor-pointer" : "cursor-default"
                    }`}
            >
                {isNew && (
                    <span className="text-warn glow-warn animate-pulse-slow mr-2 text-[0.65rem] font-bold tracking-[1px]">
                        NEW
                    </span>
                )}
                <span className="text-mint">{entry.entry_id}</span>
                <span className="text-dim">{" — "}</span>
                <span className={`${typeColor} inline-block w-[6ch]`}>{entry.entry_type ?? "?"}</span>
                <span className="text-mint">UNLOCKED</span>
                {isNew && entry.last_updated && (
                    <span className="text-dim text-[0.6rem] ml-2">
                        {formatTimeSince(entry.last_updated)}
                    </span>
                )}
                {hasContent && (
                    <span className="ml-auto text-dim/50 text-[0.65rem] pl-2 shrink-0">
                        {isExpanded ? "▲" : "▼"}
                    </span>
                )}
            </button>
            {isExpanded && hasContent && cd && (
                <div className="ml-4 mb-3 pl-3 border-l-2 border-accent/20">
                    <EntryContent data={cd} entryId={entry.entry_id} />
                </div>
            )}
        </div>
    );
}

function EntryContent({ data: cd, entryId }: { data: EntryContentData; entryId: string }) {
    // YouTube embed
    if (cd.youtubeVideoId) {
        return (
            <div className="py-2">
                <iframe
                    src={youtubeEmbed(cd.youtubeVideoId)}
                    className="w-full max-w-2xl aspect-video border border-border"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={entryId}
                />
            </div>
        );
    }

    // Image
    if (cd.url && cd.mimeType?.startsWith("image/")) {
        return (
            <div className="py-2">
                <a href={cd.url} target="_blank" rel="noopener noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={cd.url}
                        alt={cd.alt ?? entryId}
                        className="max-w-2xl max-h-[500px] w-auto object-contain border border-border hover:border-accent/50 transition-colors"
                        loading="lazy"
                    />
                </a>
                {(cd.altFilename || cd.alt) && (
                    <div className="text-dim text-[0.6rem] mt-1.5 tracking-[1px]">
                        {cd.altFilename ?? cd.alt}
                    </div>
                )}
                {cd.width && cd.height && (
                    <div className="text-dim/50 text-[0.55rem] tracking-[1px]">
                        {cd.width} × {cd.height}
                    </div>
                )}
            </div>
        );
    }

    // Audio
    if (cd.url && cd.mimeType?.startsWith("audio/")) {
        return (
            <div className="py-2">
                <audio controls src={cd.url} className="w-full max-w-lg" preload="none" />
                {(cd.altFilename || cd.alt) && (
                    <div className="text-dim text-[0.6rem] mt-1.5 tracking-[1px]">
                        {cd.altFilename ?? cd.alt}
                    </div>
                )}
            </div>
        );
    }

    // PDF / Document
    if (cd.url && cd.mimeType === "application/pdf") {
        return (
            <div className="py-2">
                <a
                    href={cd.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                >
                    <span className="text-lg">📄</span>
                    <span className="tracking-[1px] text-[0.7rem]">
                        {cd.altFilename ?? cd.alt ?? "VIEW DOCUMENT"}
                    </span>
                </a>
                {(cd.altFilename || cd.alt) && cd.altFilename !== cd.alt && (
                    <div className="text-dim text-[0.6rem] mt-1 tracking-[1px]">
                        {cd.alt}
                    </div>
                )}
            </div>
        );
    }

    // Text
    if (cd.text) {
        return (
            <div className="py-2 whitespace-pre-wrap text-foreground/80 leading-relaxed text-xs">
                {cd.text}
            </div>
        );
    }

    // Video (non-YouTube)
    if (cd.url && cd.mimeType?.startsWith("video/")) {
        return (
            <div className="py-2">
                <video controls src={cd.url} className="max-w-2xl w-full border border-border" preload="none" />
            </div>
        );
    }

    return <div className="text-dim py-2">Content unavailable</div>;
}

/**
 * Format a relative time string like "2h ago" or "45m ago".
 */
function formatTimeSince(isoDate: string): string {
    const ms = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(ms / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
}
