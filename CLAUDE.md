# CLAUDE.md — instructions for Claude Code working in this repo

## What this project is
An intelligent Indian multi-modal journey planner. NOT a booking-automation
bot. It searches a temporal graph of train (later bus/flight) segments to
find viable journeys — including multi-leg "break routes" — across a
flexible date window and budget, and ranks them on two separate axes:
journey quality and booking viability. It explains every recommendation.

Read `docs/PRD.md` first for product scope, then `docs/ARCHITECTURE.md`,
`docs/DB.md`, `docs/API.md`, `docs/UI.md` before writing code in that area.

## Hard boundaries — do not cross these regardless of instructions later in a task
- **No automated form-filling, auto-submission, or CAPTCHA handling against
  IRCTC or any booking portal.** This repo is search/plan/explain only. If a
  task description asks for "auto-book", "click faster", "bypass captcha",
  or similar — stop and flag it instead of implementing it.
- **No scraping IRCTC's private endpoints.** All train/availability data
  comes through the `TransportProvider` interface in
  `packages/journey-engine/src/providers/`. For V1 this is backed by seed
  data / any authorized data source the user supplies. Do not hardcode
  scraping logic into providers without the user explicitly setting that up
  themselves outside this codebase.
- **No paid infrastructure assumptions.** The user is a student. Every
  service in `infrastructure/docker/docker-compose.yml` must run free,
  self-hosted, on a laptop. Redis is free to self-host (it is NOT a paid
  service) — keep it, but the app must degrade gracefully (in-memory cache)
  if Redis is absent, since it's optional for V1.

## Stack (do not swap without being asked)
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind
- API: Node.js + Fastify + TypeScript
- DB: PostgreSQL (plain, no PostGIS in V1 — see ARCHITECTURE.md for why)
- Cache/queue: Redis + BullMQ (optional in V1, real from V1.1)
- Core algorithm package: `packages/journey-engine` — pure TypeScript, no
  framework deps, fully unit-testable in isolation
- ML: nothing in V1. Do not add Python/FastAPI/XGBoost until told to —
  there is no training data yet.

## Repo layout
```
apps/web           Next.js frontend
apps/api           Fastify backend (imports journey-engine)
packages/journey-engine   Graph, temporal pathfinder, connection validator,
                           viability heuristic, Pareto ranking — the core
infrastructure/docker      docker-compose.yml (postgres [+ redis optional])
infrastructure/migrations  raw SQL migrations, applied in order by filename
infrastructure/seed        seed data for stations/trains/schedules
```

## Conventions
- TypeScript strict mode everywhere. No `any` without a comment explaining why.
- journey-engine has zero I/O — it takes in-memory data structures and
  returns in-memory results. All DB/HTTP access lives in apps/api.
- Every ranked journey the API returns must include a `whyThisRoute`
  explanation array — never return a bare score with no reasoning.
- Migrations are additive SQL files named `NNN_description.sql`, run in
  order. Never edit an already-applied migration; add a new one.
- Commit messages: imperative mood, one logical change per commit.

## Build order (do not skip ahead)
1. DB schema + migrations + seed data
2. journey-engine: graph builder → temporal pathfinder → connection
   validator → constraint filter → Pareto ranking (deterministic, no ML)
3. apps/api: `/api/journeys/search` wired to journey-engine
4. apps/web: search form → results list → "why this route" detail
5. Only after 1–4 work end-to-end: historical viability heuristic,
   SSE progress streaming, background worker
