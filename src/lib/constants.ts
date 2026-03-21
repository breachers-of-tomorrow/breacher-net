// ============================================================
// Centralized constants — single source of truth for values
// shared across the application.
//
// Update values here instead of hunting through components.
// ============================================================

/** Marathon's Steam Application ID. */
export const MARATHON_STEAM_APP_ID = 3065800;

// ============================================================
// Theme color tokens for JS contexts (Recharts, canvas, etc.)
//
// These MUST stay in sync with the CSS custom properties in
// globals.css.  Recharts SVG props require literal hex strings,
// so we mirror the design-system palette here.
// ============================================================

export const THEME = {
  /** Primary accent — headings, links, glows */
  accent: "#038ADF", // --color-cryo-accent
  /** Secondary accent — system response */
  accent2: "#00D4EB", // --color-cryo-accent2
  /** Tertiary accent — success, status */
  mint: "#00FF9D", // --color-mint
  /** Warning states */
  warn: "#FFAA00", // --color-cryo-warn
  /** Errors, kill count, alerts */
  danger: "#FF3344", // --color-cryo-danger
  /** Page background */
  bg: "#031A22", // --color-cryo-bg
  /** Card/panel backgrounds */
  panel: "#0A2A35", // --color-cryo-panel
  /** Elevated card backgrounds */
  card: "#12384A", // --color-void-card
  /** Panel borders, dividers */
  border: "#1A4660", // --color-cryo-border
  /** Main body text */
  text: "#8AACB8", // --color-cryo-text
  /** Secondary/meta text */
  dim: "#5A7A8A", // --color-cryo-dim
  /** Headings, emphasis */
  heading: "#E0DDD2", // --color-text-heading
} as const;

/**
 * Extended palette for chart series that need more colors than
 * the core design system provides (e.g. 9 camera feeds).
 */
export const CHART_EXTENDED = {
  /** Kill count secondary line / projection */
  killSecondary: "#FF6B35",
  /** Stabilization camera: Cryo Hub */
  pink: "#FF6B9D",
  /** Stabilization camera: Camera 06 */
  purple: "#9D7AFF",
  /** Stabilization camera: Camera 09 */
  warmOrange: "#FF9D4A",
} as const;
