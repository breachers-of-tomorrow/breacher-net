-- breacher-net database schema
-- Stores historical state snapshots and build events from cryoarchive.systems

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- State snapshots (polled from /api/public/state)
-- ============================================================
CREATE TABLE IF NOT EXISTS state_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Kill counter
    kill_count      BIGINT,

    -- Ship date
    ship_date       TIMESTAMPTZ,
    next_update     TIMESTAMPTZ,
    build_version   TEXT,

    -- Sector states (JSONB for flexibility as sectors may change)
    sectors         JSONB NOT NULL DEFAULT '{}',

    -- Memory flags
    memory_flags    JSONB NOT NULL DEFAULT '{}',

    -- Raw API response for future-proofing
    raw_response    JSONB
);

CREATE INDEX IF NOT EXISTS idx_state_snapshots_captured
    ON state_snapshots (captured_at DESC);

-- ============================================================
-- Stabilization snapshots (polled from /api/public/cctv-cameras/stabilization)
-- ============================================================
CREATE TABLE IF NOT EXISTS stabilization_snapshots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Camera levels as JSONB (camera names may change)
    cameras         JSONB NOT NULL DEFAULT '{}',

    -- Next stabilization time
    next_stabilization TIMESTAMPTZ,

    -- Raw response
    raw_response    JSONB
);

CREATE INDEX IF NOT EXISTS idx_stabilization_captured
    ON stabilization_snapshots (captured_at DESC);

-- ============================================================
-- Build events (detected changes to cryoarchive.systems)
-- ============================================================
CREATE TABLE IF NOT EXISTS build_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Build identifier (hash, version, etc.)
    build_hash      TEXT,
    build_version   TEXT,

    -- What changed
    summary         TEXT,
    details         JSONB,

    -- HTTP headers at detection time
    headers         JSONB,

    -- Diff from previous build (if available)
    diff_summary    TEXT
);

CREATE INDEX IF NOT EXISTS idx_build_events_detected
    ON build_events (detected_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_build_events_hash
    ON build_events (build_hash) WHERE build_hash IS NOT NULL;

-- ============================================================
-- Poller health tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS poller_heartbeats (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poller_name     TEXT NOT NULL,
    heartbeat_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status          TEXT NOT NULL DEFAULT 'ok',
    details         JSONB
);

CREATE INDEX IF NOT EXISTS idx_heartbeats_poller
    ON poller_heartbeats (poller_name, heartbeat_at DESC);
