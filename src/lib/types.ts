// ============================================================
// Cryoarchive API types — matches cryoarchive.systems responses
// ============================================================

/** Sector names in the game */
export const SECTOR_NAMES = [
  "cargo",
  "index",
  "revival",
  "biostock",
  "steerage",
  "preservation",
  "cryoHub",
] as const;

export type SectorName = (typeof SECTOR_NAMES)[number];

/** Camera names (sectors + numbered cameras) */
export const CAMERA_NAMES = [
  ...SECTOR_NAMES,
  "camera06",
  "camera09",
] as const;

export type CameraName = (typeof CAMERA_NAMES)[number];

// ---- API Response Types ----

export interface SectorState {
  unlocked: boolean;
  completed: boolean;
}

export interface CryoarchiveState {
  pages: Record<SectorName, SectorState>;
  shipDate: string;
  memoryUnlocked: boolean;
  memoryCompleted: boolean;
  uescKillCount: number;
  uescKillCountNextUpdateAt: string;
}

export interface StateApiResponse {
  state: CryoarchiveState;
}

export interface CameraStabilization {
  stabilizationLevel: number;
  nextStabilizationAt: string | null;
}

export interface StabilizationApiResponse {
  stabilization: Record<CameraName, CameraStabilization>;
}

// ---- Internal types for processed data ----

export interface KillCountData {
  count: number;
  nextUpdateAt: Date | null;
  delta: number | null;
  killsPerMinute: number | null;
  lastUpdated: Date;
  isLive: boolean;
}

export interface StateHistoryRow {
  timestamp: string;
  shipDate: string;
  memoryUnlocked: boolean;
  memoryCompleted: boolean;
  uescKillCount: number;
  uescKillCountNextUpdateAt: string;
  sectors: Record<SectorName, SectorState>;
}

export interface StabilizationHistoryRow {
  timestamp: string;
  cameras: Record<CameraName, { stabilizationLevel: number; nextStabilizationAt: string | null }>;
}

export interface BuildEvent {
  detected_at: string;
  deployment_id: string;
  etag?: string;
  page_hash?: string;
  chunk_count: number;
  asset_count: number;
  changes: string[];
  http_status?: number;
  chunks_added?: string[];
  chunks_removed?: string[];
}

// ---- Chart data ----

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number | null;
}
