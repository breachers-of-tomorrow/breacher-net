"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MarathonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marathon metrics error:", error);
  }, [error]);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-8 py-16 text-center">
      <div className="cryo-panel p-8 sm:p-12">
        <div className="font-[var(--font-display)] text-[0.6rem] tracking-[4px] text-warn mb-4 animate-pulse-slow">
          ⚠ DATA FEED INTERRUPTED
        </div>
        <h1 className="font-[var(--font-display)] text-xl sm:text-2xl font-black text-warn glow-warn tracking-[4px] mb-4">
          METRICS OFFLINE
        </h1>
        <p className="text-dim text-sm mb-8 max-w-md mx-auto">
          Failed to retrieve metrics data from the database. The poller may be
          syncing or the database connection was interrupted.
        </p>
        {error.digest && (
          <div className="text-[0.6rem] text-dim mb-6">
            Error ID: {error.digest}
          </div>
        )}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={reset}
            className="font-[var(--font-display)] text-xs tracking-[2px] px-5 py-2.5 border border-accent text-accent hover:bg-accent/10 transition-colors cursor-pointer"
          >
            RETRY CONNECTION
          </button>
          <Link
            href="/"
            className="font-[var(--font-display)] text-xs tracking-[2px] px-5 py-2.5 border border-border text-dim hover:border-accent hover:text-accent transition-colors no-underline"
          >
            RETURN TO BASE
          </Link>
        </div>
      </div>
    </main>
  );
}
