# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.1] - 2026-03-15

### Added

- **Kill count chart** — recharts-powered area chart showing UESC kill count over time on the dashboard
- **Stabilization chart** — recharts-powered line chart displaying camera stabilization trends
- **Browser impersonation module** (`poller/browser.py`) — `CryoBrowser` class using `curl_cffi` to bypass Vercel Security Checkpoint via TLS fingerprint impersonation ([#49](https://github.com/breachers-of-tomorrow/breacher-net/issues/49))

### Changed

- **DB-only architecture** — all data now served exclusively from the polled PostgreSQL database; no user request ever contacts cryoarchive.systems directly
- **Client refresh intervals** — DashboardClient and CamerasClient now refresh every 5 minutes (matching poller cadence) instead of 60 seconds
- **Nav section headings** — increased font size from 0.45rem to 0.6rem for WCAG AA contrast compliance
- **README rewrite** — updated with DAC auth documentation, environment variable reference, and architecture overview
- **DAC auth as mounted secret** — DAC authentication file treated as K8s-mounted secret instead of committed file; added to `.gitignore`
- **Poller dependencies** — replaced `requests` with `curl_cffi` for browser-impersonated HTTP
- **`/api/state/latest`** and **`/api/stabilization/latest`** — removed live API fallback; return 503 if DB is empty

### Removed

- **`/api/state/live`** — proxy route that forwarded every user request to cryoarchive state API
- **`/api/stabilization/live`** — proxy route that forwarded every user request to cryoarchive stabilization API
- **`/api/index-entries/scrape`** — full auth + scrape route that hit cryoarchive on every request
- **Live scrape fallback** in IndexArchiveClient — DB is now the only data source

### Fixed

- **Session cookie persistence** — poller now persists session cookies in the database across runs, preventing rate-limit issues on the scrape route
- **Vercel Security Checkpoint bypass** — pollers no longer fail when Vercel bot protection is enabled on upstream

## [0.4.0] - 2026-03-14

### Added

- **Index Archive page** — scrapes cryoarchive.systems/indx and displays entry index with type/status counts, filter tabs, and terminal-styled entry list
- Index entry poller (`poller/poll_index.py`) with DB storage and periodic snapshot tracking
- New `index_entries` and `index_snapshots` database tables
- API routes: `/api/index-entries` (DB-backed) and `/api/index-entries/scrape` (live fallback)
- Signal Mint glow utilities (`.glow-mint`, `.box-glow-mint`)

### Changed

- **Revised color palette** — migrated from faction cyan/green (#00E5CC/#39FF14) to Breacher Blue/Cyan/Mint (#038ADF/#00D4EB/#00FF9D) with teal-dark backgrounds (#031A22 series)
- **Navigation restructured** — renamed tabs (Cameras, Maps, Site Changes), added Index Archive, reordered external links (Wiki first)
- **Landing page redesigned** — new BREACH//NET hero branding, updated nav cards to include Index Archive, reorganized community links (Wiki, Discord, Community Doc, Winnower Garden)
- **Build tracker fix** — rewrote `poll_build.py` fingerprinting to use Vercel deployment ID (`dpl_XXXX`) and static asset hashes instead of body content, eliminating false positives from dynamic page content
- Header branding changed from `BREACHER.NET` to `BREACH//NET`
- Status dot uses Signal Mint (#00FF9D) for online indicator
- Panel top borders now include blue accent gradient
- Updated all page metadata titles for consistency
- Map zone colors updated to new palette

## [0.3.0] - 2026-03-14

### Added

- Interactive terminal maps with zone inspection and lightbox galleries
- Three fully mapped areas: Perimeter, Dire Marsh, and Outpost
- SVG overlay circles with hover/click interactivity for each terminal zone
- Zone info panels with route details, terminal photos (exterior + interior), and stabilization data
- Fullscreen lightbox for terminal photo viewing
- Live camera stabilization data integration on map pages
- Sub-tab navigation between map areas
- 39 map assets (3 background maps + 36 terminal photos from upstream)

## [0.2.0] - 2026-03-13

### Added

- Latest-data API routes (`/api/state/latest`, `/api/stabilization/latest`, `/api/builds/latest`) with DB-first, live-API fallback
- Multi-platform container builds (amd64/arm64) via QEMU + Buildx
- Docker Compose dev/prod overrides with health checks
- Tau Ceti World link in community section
- `.env.example` for local development setup

### Changed

- Rewrote Changes page with live DB fetch and structured event display
- Migrated to faction palette (dark cyan/green theme refinement)
- Added wiki navigation link

### Fixed

- Poller field mappings: `uescKillCount`, `pages`, `uescKillCountNextUpdateAt`, `stabilization` now correctly parsed from API response
- Clock component memory leak (proper `useEffect` cleanup for `setInterval`)
- Removed non-existent `build_version` column from state poller INSERT

## [0.1.0] - 2026-03-12

### Added

- Next.js 16 application with TypeScript 5 and Tailwind CSS 4
- Cryoarchive dark theme (cyan/green sci-fi aesthetic)
- Landing page with live API status summary
- Dashboard: sector grid, kill counter with delta tracking, ship date countdown, auto-refresh
- Camera monitoring: stabilization level bars, alert thresholds, color-coded status
- Build tracker: expandable timeline with technical details
- Maps page stub (pending SVG port)
- Navigation with desktop tabs, mobile hamburger menu, live clock
- PostgreSQL schema for historical state, stabilization, and build event storage
- Python poller service (state every 5 min, build checks every 60s) with supercronic
- API routes: `/api/health`, `/api/state/history`, `/api/stabilization/history`, `/api/builds`
- Graceful database fallback — app works standalone with direct API calls
- Docker Compose for full local dev stack (app + PostgreSQL + poller)
- Multi-stage Dockerfile with standalone output
- GitHub Actions CI pipeline (lint, build, push to ghcr.io)
- README with Mermaid architecture diagram
- CONTRIBUTING guide with branch strategy
- Credits for CrowdTypical (original author) and Winnower Garden (historical data)

### Changed

- Migrated from static HTML/Python to Next.js App Router architecture
- Replaced CSV data storage design with PostgreSQL

[Unreleased]: https://github.com/breachers-of-tomorrow/breacher-net/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/breachers-of-tomorrow/breacher-net/releases/tag/v0.1.0
