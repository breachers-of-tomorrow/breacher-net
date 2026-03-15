"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-8 py-16 text-center">
      <div className="cryo-panel p-8 sm:p-12">
        <div className="font-[var(--font-display)] text-[0.6rem] tracking-[4px] text-danger mb-4 animate-pulse-slow">
          ⚠ SYSTEM FAULT DETECTED
        </div>
        <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-black text-danger glow-danger tracking-[4px] mb-4">
          CRITICAL ERROR
        </h1>
        <p className="text-dim text-sm mb-8 max-w-md mx-auto">
          An unexpected error occurred while processing your request.
          The system has logged the fault for review.
        </p>
        {error.digest && (
          <div className="text-[0.65rem] text-dim/60 font-mono mb-6">
            FAULT ID: {error.digest}
          </div>
        )}
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="font-[var(--font-display)] text-xs tracking-[3px] uppercase px-6 py-3 bg-accent/10 border border-accent text-accent hover:bg-accent/20 transition-colors cursor-pointer"
          >
            RETRY CONNECTION
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
