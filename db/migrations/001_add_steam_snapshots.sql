-- Migration 001: Add steam_snapshots table for historical player count data
-- Required for player count time-series graph and kills-per-player analysis

CREATE TABLE IF NOT EXISTS steam_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    player_count    INTEGER NOT NULL,
    app_id          INTEGER NOT NULL DEFAULT 3065800
);

CREATE INDEX IF NOT EXISTS idx_steam_snapshots_captured
    ON steam_snapshots (captured_at DESC);

-- Cleanup: Remove state_snapshots rows with NULL kill_count (bad polls)
DELETE FROM state_snapshots WHERE kill_count IS NULL;

-- Cleanup: Remove stabilization_snapshots with empty cameras (bad polls)
DELETE FROM stabilization_snapshots WHERE cameras = '{}' OR cameras IS NULL;
