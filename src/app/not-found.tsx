import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ERROR 0x00000404 — Sector Not Found",
  description: "The requested data sector could not be located.",
};

export default function NotFound() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-8 py-16">
      <div className="cryo-panel p-8 sm:p-12 font-[var(--font-mono)]">
        {/* Error code header */}
        <div className="text-warn text-xs tracking-[4px] mb-1 animate-pulse">
          ERROR 0x00000404
        </div>
        <div className="border-b border-warn/30 mb-6" />

        <h1 className="font-[var(--font-display)] text-3xl sm:text-5xl font-black text-warn glow-warn tracking-[6px] mb-4">
          SECTOR NOT FOUND
        </h1>

        <p className="text-dim text-sm leading-relaxed mb-6 max-w-lg">
          The requested data sector could not be located.
          It may have been purged, corrupted, or classified.
        </p>

        {/* Terminal-style recommendations */}
        <div className="text-sm leading-relaxed mb-8 space-y-1">
          <p className="text-foreground">
            <span className="text-accent2">{">"}&#32;</span>
            Recommended: Return to{" "}
            <Link
              href="/"
              className="text-accent hover:glow-accent transition-all underline underline-offset-4"
            >
              BREACHER//NET
            </Link>
          </p>
          <p className="text-foreground">
            <span className="text-accent2">{">"}&#32;</span>
            Or try: access{" "}
            <Link
              href="/cryoarchive"
              className="text-accent hover:glow-accent transition-all underline underline-offset-4"
            >
              CRYOARCHIVE
            </Link>
          </p>
        </div>

        {/* System note */}
        <div className="border-t border-border/30 pt-4">
          <p className="text-dim text-[0.65rem] tracking-[2px]">
            SYSTEM NOTE: This access attempt has been logged.
          </p>
        </div>
      </div>
    </main>
  );
}
