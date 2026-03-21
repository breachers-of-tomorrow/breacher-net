"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface KillCountRow {
  captured_at: string;
  kill_count: string | number;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

const HISTORY_API = "/api/state/history?limit=1000";

/**
 * Fetch kill-count history from the DB-backed API.
 *
 * Returns sorted rows already deduplicated server-side (the SQL uses
 * a `lag()` window function to collapse consecutive identical
 * kill_counts).  `deduped` is an alias for `rows` kept for backward
 * compatibility.
 *
 * @returns `{ rows, deduped, loading, error }`
 */
export function useKillCountData() {
  const [rows, setRows] = useState<KillCountRow[]>([]);
  const [deduped, setDeduped] = useState<KillCountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(HISTORY_API);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const json = await res.json();

        const raw: KillCountRow[] = json.data ?? [];
        if (raw.length === 0) {
          if (!cancelled) setError("No historical data yet");
          return;
        }

        const sorted = [...raw].sort(
          (a, b) =>
            new Date(a.captured_at).getTime() -
            new Date(b.captured_at).getTime(),
        );

        // Server-side SQL already deduplicates via lag() window function,
        // so sorted data is ready to use directly.

        if (!cancelled) {
          setRows(sorted);
          setDeduped(sorted);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load kill data",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { rows, deduped, loading, error } as const;
}
