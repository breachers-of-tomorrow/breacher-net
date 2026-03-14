# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
