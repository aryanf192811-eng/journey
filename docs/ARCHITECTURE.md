# ARCHITECTURE.md

## Constraints that shaped this
- Student budget: **zero paid infrastructure**. Everything below runs
  free, self-hosted, via `docker compose up`.
- No booking automation (see CLAUDE.md). This is a search/rank/explain
  system only — it never talks to IRCTC on the user's behalf.
- Built by someone who already knows PERN (Postgres/Express/React/Node)
  — don't introduce Python/ML/PostGIS/microservices until V1's
  deterministic engine works and there's a real reason.

## System diagram (V1)

```
Next.js (apps/web)
      │ REST (fetch)
      ▼
Fastify API (apps/api)
      │
      ├──► PostgreSQL   (stations, trains, schedules, journeys/searches)
      │
      └──► journey-engine (packages/journey-engine, in-process import)
                │
                ├─ graph-builder      Postgres rows → in-memory Map<StationId, Edge[]>
                ├─ temporal-pathfinder  bounded k-shortest temporal paths
                ├─ connection-validator  green/yellow/red per transfer
                ├─ constraint-filter   budget/date/class/transfer-count pruning
                ├─ viability (heuristic, NOT ML)  weakest-leg × connection-safety
                └─ ranking             Pareto-filter + weighted ordering
```

Redis/BullMQ are **not** wired into the request path in V1. Search is
synchronous (see PRD success criteria — ~3s target for a 5-day window
over a few hundred trains, which an in-memory graph search handles
fine without a queue). Redis becomes real in V1.1 when:
1. search volume needs response caching, or
2. a background worker needs to pre-warm the graph on a schedule.

Until then `infrastructure/docker/docker-compose.yml` includes Redis
as an *optional* profile so the code path can be developed against it
without it being required to run the app.

## Why plain PostgreSQL, not PostGIS, in V1
"Stations within 100km" is a nice-to-have for destination/origin
expansion. It can be done with a simple haversine SQL function on
plain lat/lng columns — PostGIS adds an extension dependency and a
learning curve for a query V1 only needs a handful of times per
search. Add PostGIS in V1.1 if the haversine approach becomes a
bottleneck or the geospatial querying needs grow (radius + routing
combined, polygons, etc).

## Why the algorithm core is its own package
`packages/journey-engine` has **no framework or I/O dependencies**.
It takes plain TypeScript data (stations, edges, a query) and returns
plain TypeScript data (ranked journeys). This means:
- it's unit-testable with zero mocking,
- it can be swapped between apps/api (Fastify) and any future worker
  process without change,
- the "hard CS" part of this project (the part that's actually
  portfolio/GATE-DSA-relevant) lives in one auditable place.

## Provider abstraction
```ts
interface TransportProvider {
  searchTrains(criteria: SearchCriteria): Promise<TrainSegment[]>;
  getSchedule(trainId: string): Promise<Schedule>;
}
```
V1 ships one implementation: `SeedDataProvider`, reading from Postgres
tables populated by `infrastructure/seed`. This keeps the door open
for an authorized-data-source provider later without touching
journey-engine or the API routes — swap the provider, nothing else
changes. **Do not build a scraping provider** — see CLAUDE.md.

## Deployment (when ready)
Docker Compose locally for dev. For a free public deploy later:
frontend on Vercel free tier, API on a free-tier host (Render/Fly.io
free tier), Postgres on a free-tier managed instance (Neon/Supabase
free tier) — all revisit-when-needed, not part of V1 build.

## Explicit non-architecture
No microservices. No Kubernetes. No message broker beyond optional
BullMQ-on-Redis later. One Next.js app, one Fastify app, one Postgres
database, one algorithm package. Resist adding anything not justified
by an actual V1 requirement above.
