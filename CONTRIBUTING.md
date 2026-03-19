# Contributing to breacher.net

Thanks for wanting to help! This project is maintained by the Breachers of Tomorrow community.

## Development Setup

### Prerequisites

- [Node.js 22+](https://nodejs.org/) (for the Next.js app)
- [Docker](https://docs.docker.com/get-docker/) (optional, for full stack)

### Quick Start

```bash
# Clone and install
git clone https://github.com/breachers-of-tomorrow/breacher-net.git
cd breacher-net
npm install

# Start dev server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000) and works without a database.

### Full Stack (with database + poller)

```bash
docker compose up
```

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — deployed to breacher.net |
| `develop` | Integration branch — PRs merge here first |
| `feature/*` | Your feature branches |

### Workflow

1. Fork the repository
2. Create a feature branch from `develop`: `git checkout -b feature/my-feature develop`
3. Make your changes
4. Run checks: `npm run lint && npm run test && npm run build`
5. Commit with a descriptive message (see below)
6. Push and open a PR targeting `develop`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add stabilization history chart
fix: correct timezone offset in countdown display
docs: update README with Docker instructions
style: adjust camera card spacing on mobile
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Code Style

- **TypeScript** — strict mode, no `any` types
- **Tailwind CSS** — utility-first, use the theme variables defined in `globals.css`
- **Components** — React functional components with hooks
- **Server vs Client** — Use server components by default; add `"use client"` only when needed (interactivity, hooks, browser APIs)

### Before Submitting

```bash
npm run lint    # ESLint checks
npm run test    # Unit tests (vitest)
npm run build   # Full production build (catches type errors)
```

All three must pass for CI to be green.

## Project Areas

Looking for something to work on? Check the [issues](https://github.com/breachers-of-tomorrow/breacher-net/issues) — they're labeled by area and priority.

| Area | What It Covers |
|------|----------------|
| `area::frontend` | React components, pages, styling |
| `area::backend` | API routes, database queries |
| `area::infrastructure` | Docker, CI/CD, deployment |
| `area::data` | Poller, schema, data pipeline |

## Questions?

- Open an issue for bugs or feature requests
- Join the [Discord](https://discord.gg/sGeg5Gx2yM) for discussion
