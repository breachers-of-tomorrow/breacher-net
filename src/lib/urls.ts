// ============================================================
// Centralized external URLs — single source of truth for all
// outbound links used across the site.
//
// Update URLs here instead of hunting through components.
// See: https://github.com/breachers-of-tomorrow/breacher-net/issues/35
// ============================================================

/** Base site URL used for meta tags, sitemap, and canonical links */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://breacher.net";

// ---- Community ----

export const URLS = {
  /** Breachers of Tomorrow Discord */
  discord: "https://discord.gg/sGeg5Gx2yM",

  /** Community wiki */
  wiki: "https://wiki.breacher.net",

  /** Community objectives Google Doc */
  communityDoc:
    "https://docs.google.com/document/d/1mtUtDPvbh6ahiynYFVS7Z4O79Nw6y5PEOjweCpzWV_A/edit?tab=t.0",

  /** Community doc — "how can I help" section (direct anchor) */
  communityDocHelp:
    "https://docs.google.com/document/d/1mtUtDPvbh6ahiynYFVS7Z4O79Nw6y5PEOjweCpzWV_A/edit?tab=t.0#heading=h.5j4qeuoxhabo",

  // ---- External trackers / tools ----

  /** Winnower Garden historical data archive */
  winnower: "https://marathon.winnower.garden/cryoarchive",

  /** Tau Ceti community project */
  tauCeti: "https://tauceti.world",

  /** Cryoarchive source site */
  cryoarchive: "https://cryoarchive.systems",

  /** Cryoarchive index page (used for external link in index archive) */
  cryoarchiveIndex: "https://cryoarchive.systems/indx",

  // ---- GitHub ----

  /** Breachers of Tomorrow GitHub org */
  github: "https://github.com/breachers-of-tomorrow",

  /** CrowdTypical — original tracker author */
  crowdTypical: "https://github.com/CrowdTypical",
} as const;

/** YouTube embed URL builder */
export function youtubeEmbed(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}
