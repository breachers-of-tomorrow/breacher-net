"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function CryoarchiveError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Cryoarchive error:", error);
  }, [error]);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-8 py-16 text-center">
      <div className="cryo-panel p-8 sm:p-12">
        <div className="font-[var(--font-display)] text-[0.6rem] tracking-[4px] text-warn mb-4 animate-pulse-slow">
          ⚠ DATA FEED INTERRUPTED
        </div>
        <h1 className="font-[var(--font-display)] text-xl sm:text-2xl font-black text-warn glow-warn tracking-[4px] mb-4">
          CRYOARCHIVE OFFLINE
        </h1>
        <p className="text-dim text-sm mb-8 max-w-md mx-auto">
          Failed to retrieve data from the cryoarchive database.
          The poller may be syncing or the database connection was interrupted.
        </p>
        {error.digest && (
          <div className="text-[0.65rem] text-dim/60 font-mono mb-6">
            FAULT ID: {error.digest}
          </div>
        )}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={reset}
            className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-accent/10 border border-accent text-accent hover:bg-accent/20 transition-colors cursor-pointer"
          >
            RETRY
          </button>
          <Link
            href="/"
            className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-panel border border-border text-dim hover:text-foreground hover:border-accent transition-colors no-underline"
          >
            RETURN HOME
          </Link>
        </div>
      </div>
    </main>
  );
}
