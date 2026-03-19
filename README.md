# breacher.net

Community hub and live tracking dashboard for the [Marathon](<https://en.wikipedia.org/wiki/Marathon_(upcoming_video_game)>) ARG — built by the Breachers of Tomorrow.

**Live site:** [breacher.net](https://breacher.net)

## What is this?

The Marathon ARG revolves around [cryoarchive.systems](https://cryoarchive.systems), an in-universe website that updates in real-time with kill counts, sector states, camera stabilization levels, and more. This project tracks those changes, provides historical data, and serves as a community gateway.

### Features

- **Live Dashboard** — Real-time sector status, kill counter with delta tracking, ship date countdown
- **Kill Count Chart** — Historical kill count trend rendered with recharts from database snapshots
- **Camera Monitoring** — Stabilization levels for all CCTV cameras with alert thresholds and historical chart
- **Cryoarchive Index** — Authenticated access to the /indx archive with full-text content extraction (1200+ entries)
- **Build Tracker** — Detects and logs changes to cryoarchive.systems
- **Terminal Maps** — Interactive ASCII terminal maps for sector navigation
- **Community Hub** — Links to Discord, Wiki, Google Doc, and community resources

## Quick Start

### Option 1: Full stack with Docker (recommended)

```bash
git clone https://github.com/breachers-of-tomorrow/breacher-net.git
cd breacher-net
docker compose up
```

This starts:
- **App** — Next.js on [http://localhost:3000](http://localhost:3000)
- **Database** — PostgreSQL for historical data
- **Poller** — Automatically collects state snapshots every 15 minutes + build checks every 60 seconds

### Option 2: App only (no database)

```bash
git clone https://github.com/breachers-of-tomorrow/breacher-net.git
cd breacher-net
npm install
npm run dev
```

The app works without a database — it fetches directly from the cryoarchive.systems API. Historical charts and the index archive won't be available, but all live data features work.

## Architecture

```mermaid
graph TD
    subgraph "breacher.net"
        App["Next.js App\n:3000"]
        StatePoller["State Poller\n(every 15m)"]
        BuildPoller["Build Poller\n(every 60s)"]
        IndexPoller["Index Poller\n(every 15m)"]
        DB["PostgreSQL 17\n(Patroni HA)"]
    end

    API["cryoarchive.systems"]
    DAC["DAC Auth File\n(K8s Secret)"]

    App -- "server proxy" --> API
    StatePoller -- "GET /api/public/state" --> API
    BuildPoller -- "HEAD + chunk diff" --> API
    IndexPoller -- "DAC auth + /indx" --> API
    IndexPoller -- "mount" --> DAC
    App -- "DAC auth (fallback)" --> DAC
    StatePoller -- "write" --> DB
    BuildPoller -- "write" --> DB
    IndexPoller -- "write" --> DB
    App -- "read" --> DB
```

- **Next.js App** — Server-rendered React with App Router. Proxies live data requests to cryoarchive.systems server-side (avoids CORS). Serves historical data from PostgreSQL.
- **State Poller** — Python CronJob. Snapshots kill count, sector states, and ship date every 15 minutes.
- **Build Poller** — Python CronJob. Checks for deployment changes every 60 seconds via chunk/asset fingerprinting.
- **Index Poller** — Python CronJob. Authenticates via DAC + password, extracts and stores all 1200+ index entries with full content.
- **PostgreSQL** — Stores state snapshots, stabilization history, build events, index entries, and session cookies.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | For DB features | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/db`) |
| `CRYO_DAC_PATH` | For index features | Path to mounted DAC authentication file (see DAC Auth below) |

## DAC Authentication

The cryoarchive index (`/indx`) requires authentication via a DAC (Digital Access Card) file. This is a PNG image unique to each Discord account.

**For Kubernetes deployment:** Mount your DAC as a secret:

```bash
kubectl create secret generic cryo-dac-auth \
  --from-file=dac.png=/path/to/your-dac-file.png \
  -n breacher-net
```

The deployment manifests mount this at `/secrets/dac/dac.png` and set `CRYO_DAC_PATH` automatically.

**For local development:** Set the env var to your DAC file path:

```bash
export CRYO_DAC_PATH=/path/to/your-dac-file.png
```

> **Note:** The DAC file should never be committed to git. It's a personal credential tied to your Discord account.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Database | PostgreSQL 17 (Patroni HA + PgBouncer) |
| Poller | Python 3.12, CronJobs |
| CI/CD | GitHub Actions → ghcr.io |
| Hosting | Kubernetes (Talos) + ArgoCD |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes (health, history, builds, proxy)
│   │   ├── state/          # State history + live proxy
│   │   ├── stabilization/  # Stabilization history + live proxy
│   │   ├── builds/         # Build event history
│   │   └── index-entries/  # Index entries + scrape fallback
│   ├── cryoarchive/        # ARG tracking pages
│   │   ├── cameras/        # Camera stabilization monitoring
│   │   ├── changes/        # Build change tracker
│   │   ├── index/          # Cryoarchive index archive
│   │   └── maps/           # Terminal maps
│   └── page.tsx            # Landing page
├── components/             # Shared React components
│   ├── KillCountChart.tsx  # Historical kill count chart
│   ├── StabilizationChart.tsx  # Camera stabilization chart
│   └── Navigation.tsx      # Site navigation
└── lib/                    # Utilities (API client, DB, types, formatting)
poller/                     # Python poller service
db/                         # Database schema
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, branch strategy, and guidelines.

**TL;DR:** Fork → feature branch → PR to `develop`. Run `npm run lint && npm run test && npm run build` before pushing.

## Related Resources

- **[Winnower Garden Cryoarchive](https://marathon.winnower.garden/cryoarchive)** — Comprehensive historical data going back to the start of the ARG. If you need data from before this project existed, Winnower has it.
- **[cryoarchive.systems](https://cryoarchive.systems)** — The official in-universe site this project tracks.

## Credits

Originally created by [CrowdTypical](https://github.com/CrowdTypical) as [Marathon-arg](https://github.com/CrowdTypical/Marathon-arg). Forked and evolved by [Breachers of Tomorrow](https://github.com/breachers-of-tomorrow).

Historical ARG data preserved by [Winnower Garden](https://marathon.winnower.garden/cryoarchive).

## License

MIT
