"use client";

/**
 * Ambient status ticker — a thin scrolling strip of in-universe
 * status messages below the navigation bar.
 *
 * - Scrolls continuously via CSS animation (ticker-scroll in globals.css)
 * - Pauses on hover for readability
 * - CSS handles prefers-reduced-motion (animation: none) — no JS branching
 * - aria-hidden since content is decorative / duplicated elsewhere
 */

const MESSAGES = [
    "SYS.KERNEL — NETWORK MESH STABLE",
    "UPLINK — BREACHER RELAY ACTIVE",
    "MARATHON — DATA FEED SYNCHRONIZED",
    "CRYOARCHIVE — CODEX INDEX NOMINAL",
    "SIGNAL — COMMUNITY CHANNEL OPEN",
    "AUTH — CLEARANCE LEVEL: PUBLIC",
    "SEC.STATUS — PERIMETER INTEGRITY 100%",
    "TRANSIT — JUMP CORRIDOR ALIGNED",
];

export default function StatusTicker() {
    // Duplicate messages so the scroll loops seamlessly
    // (CSS translateX(-50%) resets when the first copy scrolls out)
    const doubled = [...MESSAGES, ...MESSAGES];

    return (
        <div
            className="w-full overflow-hidden border-b border-border/30 bg-bg/80 backdrop-blur-sm"
            aria-hidden="true"
        >
            <div className="relative h-6 flex items-center">
                <div className="ticker-scroll whitespace-nowrap flex items-center gap-8">
                    {doubled.map((msg, i) => (
                        <span
                            key={`${msg}-${i}`}
                            className="text-[0.6rem] tracking-[3px] text-dim font-[var(--font-display)] shrink-0 flex items-center gap-8"
                        >
                            {msg}
                            <span className="text-accent2/40">{"///"}</span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
