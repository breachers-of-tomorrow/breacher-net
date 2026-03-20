"use client";

import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SteamPlayerRow {
  captured_at: string;
  player_count: number;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

const STEAM_API = "/api/steam/history?limit=1000";

/**
 * Fetch Steam player-count history from the DB-backed API.
 *
 * Returns sorted rows so every consumer gets the same data
 * without re-fetching.
 *
 * @returns `{ rows, loading, error }`
 */
export function useSteamPlayers() {
  const [rows, setRows] = useState<SteamPlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(STEAM_API);
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const json = await res.json();

        const raw: SteamPlayerRow[] = json.data ?? [];
        if (raw.length === 0) {
          if (!cancelled) {
            setError(
              "No player count history yet — data will appear after the next poll cycle",
            );
          }
          return;
        }

        const sorted = [...raw].sort(
          (a, b) =>
            new Date(a.captured_at).getTime() -
            new Date(b.captured_at).getTime(),
        );

        if (!cancelled) setRows(sorted);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load player data",
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

  return { rows, loading, error } as const;
}
