/**
 * Ambient status ticker — a thin scrolling strip of in-universe
 * status messages below the navigation bar.
 *
 * - Async server component — fetches live data (Steam, Discord,
 *   cryoarchive, data freshness) and mixes with static flavor
 * - Scrolls continuously via CSS animation (ticker-scroll in globals.css)
 * - Pauses on hover for readability
 * - CSS handles prefers-reduced-motion (animation: none) — no JS branching
 * - aria-hidden since content is decorative / duplicated elsewhere
 * - Wrapped in <Suspense> in layout.tsx; fallback = TickerSkeleton
 */

import { fetchTickerMessages, type TickerMessage } from "@/lib/ticker-data";

/** Static fallback shown while async ticker data loads */
export function TickerSkeleton() {
  return (
    <div
      className="w-full overflow-hidden border-b border-border/30 bg-bg/80 backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="relative h-6 flex items-center">
        <div className="ticker-scroll whitespace-nowrap flex items-center gap-8">
          {[
            "SYS.KERNEL — INITIALIZING DATA FEEDS",
            "UPLINK — BREACHER RELAY ACTIVE",
            "SEC.STATUS — PERIMETER INTEGRITY 100%",
            "TRANSIT — JUMP CORRIDOR ALIGNED",
          ]
            .flatMap((msg) => [msg, msg])
            .map((msg, i) => (
              <span
                key={`skel-${i}`}
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

function MessageSpan({ msg, idx }: { msg: TickerMessage; idx: number }) {
  return (
    <span
      key={`ticker-${idx}`}
      className="text-[0.6rem] tracking-[3px] text-dim font-[var(--font-display)] shrink-0 flex items-center gap-8"
    >
      {msg.kind === "live" && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-mint/70 shadow-[0_0_4px_var(--color-mint)] mr-1" />
      )}
      {msg.text}
      <span className="text-accent2/40">{"///"}</span>
    </span>
  );
}

export default async function StatusTicker() {
  const messages = await fetchTickerMessages();

  // Duplicate for seamless CSS loop (translateX(-50%) reset)
  const doubled = [...messages, ...messages];

  return (
    <div
      className="w-full overflow-hidden border-b border-border/30 bg-bg/80 backdrop-blur-sm"
      aria-hidden="true"
    >
      <div className="relative h-6 flex items-center">
        <div className="ticker-scroll whitespace-nowrap flex items-center gap-8">
          {doubled.map((msg, i) => (
            <MessageSpan key={`ticker-${i}`} msg={msg} idx={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
