// ============================================================
// API client — fetches from cryoarchive.systems APIs
// Server-side only (used in API routes and server components)
// ============================================================

import type {
  StateApiResponse,
  StabilizationApiResponse,
  CryoarchiveState,
  CameraStabilization,
  CameraName,
} from "./types";

const STATE_API = "https://cryoarchive.systems/api/public/state";
const STABILIZATION_API =
  "https://cryoarchive.systems/api/public/cctv-cameras/stabilization";

/**
 * Fetch current state from cryoarchive.systems
 * Returns null on failure (API may be down)
 */
export async function fetchState(): Promise<CryoarchiveState | null> {
  try {
    const res = await fetch(`${STATE_API}?t=${Date.now()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data: StateApiResponse = await res.json();
    return data?.state ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch camera stabilization levels
 * Returns null on failure
 */
export async function fetchStabilization(): Promise<Record<
  CameraName,
  CameraStabilization
> | null> {
  try {
    const res = await fetch(`${STABILIZATION_API}?t=${Date.now()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data: StabilizationApiResponse = await res.json();
    return data?.stabilization ?? null;
  } catch {
    return null;
  }
}
