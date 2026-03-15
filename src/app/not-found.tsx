import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Signal Lost",
  description: "The requested page could not be found.",
};

export default function NotFound() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-8 py-16 text-center">
      <div className="cryo-panel p-8 sm:p-12">
        <div className="font-[var(--font-display)] text-[0.6rem] tracking-[4px] text-warn mb-4 animate-pulse-slow">
          ⚠ SECTOR NOT FOUND
        </div>
        <h1 className="font-[var(--font-display)] text-4xl sm:text-6xl font-black text-warn glow-warn tracking-[6px] mb-4">
          404
        </h1>
        <p className="font-[var(--font-display)] text-sm tracking-[3px] text-text-heading mb-2">
          SIGNAL LOST
        </p>
        <p className="text-dim text-sm mb-8 max-w-md mx-auto">
          The requested sector could not be located in the cryoarchive.
          It may have been purged or never existed.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/"
            className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-accent/10 border border-accent text-accent hover:bg-accent/20 transition-colors no-underline"
          >
            RETURN HOME
          </Link>
          <Link
            href="/cryoarchive"
            className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-panel border border-border text-dim hover:text-foreground hover:border-accent transition-colors no-underline"
          >
            OPEN DASHBOARD
          </Link>
        </div>
      </div>
    </main>
  );
}
