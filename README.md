# Journey Intelligence — V1

An intelligent Indian multi-modal journey planner. Search a temporal
graph of train legs (including multi-leg "break routes") across a
flexible date window and budget, ranked on journey quality and booking
viability, with every recommendation explained. See `docs/PRD.md` for
the full product spec and `CLAUDE.md` for what this deliberately is
NOT (no booking automation — see that file's hard boundaries).

Read in this order: `docs/PRD.md` → `docs/ARCHITECTURE.md` →
`docs/DB.md` → `docs/API.md` → `docs/UI.md`.

## Verified working (this build was tested end-to-end, not just typechecked)
- `packages/journey-engine` unit tests pass (`npm test`) — proves the
  temporal pathfinder correctly finds safe multi-leg routes and
  rejects dangerously tight connections, and that Pareto ranking keeps
  genuine trade-offs while dropping strictly-dominated journeys.
- `apps/api` unit tests pass (`npm test`) — route validation and the
  RailRadar status-string parser.
- Full stack was run live against real Postgres + Fastify + Next.js:
  a Vadodara→Muzaffarpur search with no direct train in budget
  correctly surfaced a 1-transfer route via Delhi with a "Low"
  connection-risk badge, and correctly excluded a cheaper-but-riskier
  alternative with only a 20-minute transfer window.

## Local setup

### 1. Database
You need PostgreSQL 16 running locally. Either:

**Option A — Docker (recommended, needs Docker Desktop/Engine running):**
```bash
cd infrastructure/docker
docker compose up -d postgres
```
This automatically applies migrations and seed data on first boot
(via `init-db.sh`).

**Option B — a native Postgres install:**
```bash
createdb travel_intelligence
psql -d travel_intelligence -f infrastructure/migrations/001_init.sql
psql -d travel_intelligence -f infrastructure/seed/001_stations.sql
psql -d travel_intelligence -f infrastructure/seed/002_trains.sql
```

### 2. journey-engine (build once, others depend on it)
```bash
cd packages/journey-engine
npm install
npm run build
npm test          # optional but recommended — proves the algorithm works
```

### 3. API
```bash
cd apps/api
npm install
DATABASE_URL="postgres://postgres:postgres@localhost:5432/travel_intelligence" npm run dev
# → http://localhost:4000
```

**Optional — live booking viability via RailRadar:** without this,
`bookingViability` stays `"unknown"` everywhere (honest default, not a
bug). To turn it on:
1. Sign up free at [railradar.in](https://railradar.in) (no credit
   card) and generate a key in the Developers dashboard — free tier is
   1,000 requests/month.
2. Set `RAILRADAR_API_KEY=rr_live_...` in `apps/api`'s environment
   (e.g. alongside `DATABASE_URL` above, or in `apps/api/.env` — see
   `.gitignore`, never commit this key).
Results are cached in-memory for 15 minutes to stay inside the free
tier. See `apps/api/src/infrastructure/railradar.ts` and `CLAUDE.md`'s
2026-09-25 decision for why this data source and not another.

### 4. Web
```bash
cd apps/web
npm install
NEXT_PUBLIC_API_URL=http://localhost:4000 npm run dev
# → http://localhost:3000
```

### 5. Try it
Open http://localhost:3000, search Vadodara (BRC) → Muzaffarpur (MFP),
dates 16–20 Nov, budget ₹2500, classes SL+3A, max 1 transfer. You
should see a direct option and a 1-transfer via Delhi option, each
with a "Why this route" breakdown.

## What's genuinely done vs. stubbed
- **Done and tested:** graph builder, temporal pathfinder, connection-
  risk validator, Pareto ranking, full REST API, full search→results→
  detail UI flow, seed data covering direct + multi-leg + a
  deliberately-risky-connection scenario.
- **Stubbed honestly, not faked:** `bookingViability` returns
  `"unknown"` everywhere in V1 because there's no real availability
  data source wired up yet (see `docs/DB.md` `availability_snapshots`
  table and `docs/PRD.md` open questions) — this was a deliberate
  product decision, not an oversight: the whole point of this product
  is not fabricating confidence it doesn't have.
- **Not built:** origin/destination expansion returns nearby stations
  from the DB but with `extraTravelMinutes: 0` (placeholder — needs a
  real last-mile distance/time estimate, noted as TODO in
  `apps/api/src/routes/journeys.ts`).
