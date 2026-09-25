# API.md — REST endpoints (V1)

V1 is synchronous REST, no SSE (see ARCHITECTURE.md — SSE/worker
deferred to V1.1 unless search performance requires it sooner).

## `POST /api/journeys/search`

Request body:
```ts
{
  origin: string;        // station code or free text, resolved server-side
  destination: string;
  dateFrom: string;      // 'YYYY-MM-DD'
  dateTo: string;        // 'YYYY-MM-DD'
  budgetMax?: number;
  classes: string[];     // e.g. ['SL','3A']
  maxTransfers?: number; // default 2
  passengers?: number;   // default 1
  allowOriginExpansion?: boolean;   // default true
  allowDestExpansion?: boolean;     // default true
}
```

Response body:
```ts
{
  searchId: number;
  query: { /* echoed, resolved station codes */ };
  journeys: Journey[];
  expandedOrigins?: { stationCode: string; extraTravelMinutes: number }[];
  expandedDestinations?: { stationCode: string; extraTravelMinutes: number }[];
}
```

`Journey` (matches journey-engine's output type, see
`packages/journey-engine/src/types.ts`):
```ts
{
  legs: JourneyLeg[];
  totalFareEstimate: number;
  totalDurationMinutes: number;
  transferCount: number;
  connectionBuffers: { minutes: number; risk: 'green'|'yellow'|'red' }[];
  departureTime: string;  // ISO
  arrivalTime: string;    // ISO
  journeyQualityScore: number;   // 0-100, deterministic in V1
  bookingViability: 'high'|'medium'|'low'|'unknown';
  whyThisRoute: string[];   // e.g. ["Within your ₹2500 budget", "2h40m connection buffer"]
  cautions: string[];       // e.g. ["Separate tickets — connection not protected"]
  isOriginExpansion?: boolean;
  isDestinationExpansion?: boolean;
}
```

Validation errors → `400` with `{ error: string, field?: string }`.
No results (search ran fine, nothing survived filters) → `200` with
`journeys: []` — not a 404. A 404 is only for an unresolvable
station name.

## `GET /api/stations/search?q=<text>`
Autocomplete for the search form. Matches `stations.name`, `.city`,
`.code`, and `station_aliases.alias`, case-insensitive, prefix + trigram-ish
`ILIKE '%q%'` for V1 (full-text search is a V1.1 nicety, not needed yet).

Response: `{ stations: { code, name, city, state }[] }` (max 10).

## `GET /api/journeys/search/:searchId`
Re-fetch a previous search's results from `search_results` (survives a
page refresh without re-running the algorithm). `404` if not found.

## `GET /api/trains/:trainNumber`
Basic train info + full stop list, for a "view full schedule" detail
view. Not central to V1 but trivial given the schema — build if time
allows, skip without blocking the core flow.

## Error shape (all endpoints)
```ts
{ error: string; field?: string }
```
HTTP status: 400 (validation), 404 (not found), 500 (unexpected —
log server-side, never leak internals in the message).

## Explicitly not in V1
- No `/api/journeys/:id/book` or anything execution-adjacent. If a
  future task description asks for this, treat it as out of scope for
  this repo's stated boundaries (see CLAUDE.md) and flag it rather
  than building it.
- No auth-gated endpoints — no accounts in V1.
