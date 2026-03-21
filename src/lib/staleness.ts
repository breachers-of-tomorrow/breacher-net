// ============================================================
// Staleness detection — determines when upstream data has gone
// stale so we can show appropriate UI indicators.
//
// The upstream cryoarchive API occasionally returns cached/frozen
// responses.  When the poller keeps writing the same stale data,
// the monotonic filter in useKillCountData hides the regressed
// rows, but the latest valid data point gets increasingly old.
//
// Threshold: Data older than 1 hour is considered stale (the
// poller runs every 15 min; 4 missed cycles = something is wrong).
// ============================================================

/** How old the newest data point can be before we flag it. */
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

export interface StalenessInfo {
  /** True when the latest data is older than the threshold. */
  isStale: boolean;
  /** The age of the latest data point in milliseconds. */
  ageMs: number;
  /** Human-readable age string: "2h 15m", "45m", etc. */
  ageLabel: string;
  /** ISO timestamp of the latest data point. */
  lastUpdated: string;
}

/**
 * Compute staleness from a list of data rows that have a `captured_at`
 * timestamp.  Expects rows sorted ascending (oldest → newest).
 */
export function computeStaleness(
  rows: { captured_at: string }[],
): StalenessInfo | null {
  if (rows.length === 0) return null;

  const latest = rows[rows.length - 1];
  const latestTs = new Date(latest.captured_at).getTime();
  const ageMs = Date.now() - latestTs;

  return {
    isStale: ageMs > STALE_THRESHOLD_MS,
    ageMs,
    ageLabel: formatAge(ageMs),
    lastUpdated: latest.captured_at,
  };
}

/**
 * Compute staleness from a single ISO timestamp.
 */
export function computeStalenessFromTimestamp(
  isoTimestamp: string | null,
): StalenessInfo | null {
  if (!isoTimestamp) return null;

  const latestTs = new Date(isoTimestamp).getTime();
  if (isNaN(latestTs)) return null;

  const ageMs = Date.now() - latestTs;

  return {
    isStale: ageMs > STALE_THRESHOLD_MS,
    ageMs,
    ageLabel: formatAge(ageMs),
    lastUpdated: isoTimestamp,
  };
}

/** Format milliseconds as "2d 5h", "3h 12m", "45m", etc. */
function formatAge(ms: number): string {
  const totalMins = Math.floor(ms / 60_000);
  if (totalMins < 60) return `${totalMins}m`;

  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs < 24) return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;

  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return remHrs > 0 ? `${days}d ${remHrs}h` : `${days}d`;
}
