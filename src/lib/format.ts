// ============================================================
// Formatting utilities — timezone, countdown, numbers
// ============================================================

/**
 * Get the user's timezone abbreviation (e.g., "CST", "EST")
 */
export function getTimezoneAbbr(): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value || "";
  } catch {
    return "";
  }
}

/**
 * Format a date to local time string: "Mar 12, 3:45:12 PM CST"
 */
export function toLocal(date: Date | string | null): string {
  if (!date) return "--";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "--";
  return (
    d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }) +
    " " +
    getTimezoneAbbr()
  );
}

/**
 * Format a date to local time only: "3:45:12 PM CST"
 */
export function toLocalTimeOnly(date: Date | string | null): string {
  if (!date) return "--";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "--";
  return (
    d.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }) +
    " " +
    getTimezoneAbbr()
  );
}

/**
 * Format a date to UTC time only: "8:45:12 PM UTC"
 */
export function toUTCTimeOnly(date: Date | string | null): string {
  if (!date) return "--";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "--";
  return (
    d.toLocaleString("en-US", {
      timeZone: "UTC",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }) + " UTC"
  );
}

/**
 * Format a ship date countdown: "751y 116d 18h 14m 32s"
 */
export function formatShipCountdown(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return "ARRIVED";
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const years = Math.floor(days / 365.25);
  const remDays = Math.floor(days - years * 365.25);
  const remHrs = hrs % 24;
  const remMins = mins % 60;
  const remSecs = secs % 60;
  const parts: string[] = [];
  if (years > 0) parts.push(years + "y");
  if (remDays > 0) parts.push(remDays + "d");
  parts.push(String(remHrs).padStart(2, "0") + "h");
  parts.push(String(remMins).padStart(2, "0") + "m");
  parts.push(String(remSecs).padStart(2, "0") + "s");
  return parts.join(" ");
}

/**
 * Format a relative time: "5s ago", "3m ago", "2h 15m ago"
 */
export function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return secs + "s ago";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  return hrs + "h " + (mins % 60) + "m ago";
}

/**
 * Format a countdown: "IN 3m 45s" or "UPDATING..."
 */
export function formatCountdown(targetDate: Date): string {
  const secsLeft = Math.max(0, (targetDate.getTime() - Date.now()) / 1000);
  if (secsLeft <= 0) return "UPDATING...";
  const mins = Math.floor(secsLeft / 60);
  const secs = Math.floor(secsLeft % 60);
  return `IN ${mins}m ${secs}s`;
}

/**
 * Format a large number with commas: 187,450,082
 */
export function formatNumber(n: number): string {
  return n.toLocaleString();
}

/**
 * Format a number as millions: "187M"
 */
export function formatMillions(n: number): string {
  return (n / 1e6).toFixed(0) + "M";
}

/**
 * Compute progress percent between two dates
 */
export function computeProgress(
  start: Date,
  end: Date,
  now: Date = new Date()
): number {
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}
