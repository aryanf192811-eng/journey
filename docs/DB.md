# DB.md — PostgreSQL schema (V1)

Plain PostgreSQL, no extensions required for V1 (see ARCHITECTURE.md
for why not PostGIS yet). Distance queries use a haversine SQL
function over plain `lat`/`lng` columns.

## Tables

### stations
```sql
CREATE TABLE stations (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(10) UNIQUE NOT NULL,   -- e.g. 'BRC', 'NDLS'
  name          TEXT NOT NULL,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stations_city ON stations (city);
```

### station_aliases
Lets users search "Baroda" and find BRC, etc.
```sql
CREATE TABLE station_aliases (
  id          SERIAL PRIMARY KEY,
  station_id  INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  alias       TEXT NOT NULL
);
CREATE INDEX idx_station_aliases_alias ON station_aliases (lower(alias));
```

### trains
```sql
CREATE TABLE trains (
  id            SERIAL PRIMARY KEY,
  number        VARCHAR(10) UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  runs_on_days  SMALLINT[] NOT NULL  -- 0=Sun .. 6=Sat, ISO-ish, document in code
);
```

### train_stops
Ordered stops for a train, each with scheduled arrival/departure
*time-of-day* (schedules repeat weekly; actual dated instances are
derived at query time, not stored per-date).
```sql
CREATE TABLE train_stops (
  id              SERIAL PRIMARY KEY,
  train_id        INTEGER NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
  station_id      INTEGER NOT NULL REFERENCES stations(id),
  stop_sequence   SMALLINT NOT NULL,        -- 1, 2, 3... order along the route
  arrival_time    TIME,                     -- NULL for origin stop
  departure_time  TIME,                     -- NULL for terminus stop
  day_offset      SMALLINT NOT NULL DEFAULT 0,  -- days after departure-date
  distance_km     INTEGER,
  UNIQUE (train_id, stop_sequence)
);
CREATE INDEX idx_train_stops_station ON train_stops (station_id);
CREATE INDEX idx_train_stops_train ON train_stops (train_id, stop_sequence);
```

### train_classes / fares
Kept simple in V1 — one fare per train+class, not per-leg. Refine
later if split-journey fare calc needs it.
```sql
CREATE TABLE train_classes (
  id          SERIAL PRIMARY KEY,
  train_id    INTEGER NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
  class_code  VARCHAR(4) NOT NULL,   -- 'SL', '3A', '2A', '1A', 'CC'
  base_fare   NUMERIC(8,2) NOT NULL,
  UNIQUE (train_id, class_code)
);
```

### availability_snapshots (optional in V1, schema ready for V1.1)
```sql
CREATE TABLE availability_snapshots (
  id            SERIAL PRIMARY KEY,
  train_id      INTEGER NOT NULL REFERENCES trains(id),
  class_code    VARCHAR(4) NOT NULL,
  journey_date  DATE NOT NULL,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT NOT NULL,   -- 'AVAILABLE', 'RAC', 'WL', 'REGRET'
  wl_number     INTEGER
);
CREATE INDEX idx_avail_train_date ON availability_snapshots (train_id, journey_date, class_code);
```
V1 can leave this table empty; `booking_viability` in the API
response then returns `"unknown"` rather than a fabricated number
(see PRD non-goals). Populate it manually or via an authorized source
in V1.1 to make viability heuristics real.

### searches / search_results
Persist what a user searched and what came back — useful for both a
"saved trips" feature later and for eventually seeding
`availability_snapshots`-style historical data honestly (only once
you have a real data source, not fabricated).
```sql
CREATE TABLE searches (
  id                SERIAL PRIMARY KEY,
  origin_station_id INTEGER NOT NULL REFERENCES stations(id),
  dest_station_id   INTEGER NOT NULL REFERENCES stations(id),
  date_from         DATE NOT NULL,
  date_to           DATE NOT NULL,
  budget_max        NUMERIC(8,2),
  classes           VARCHAR(4)[] NOT NULL,
  max_transfers     SMALLINT NOT NULL DEFAULT 2,
  passengers        SMALLINT NOT NULL DEFAULT 1,
  expanded_origins       JSONB,  -- see 002_add_expansion_columns.sql — persisted so
  expanded_destinations  JSONB,  -- GET /api/journeys/search/:searchId survives a refresh
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE search_results (
  id               SERIAL PRIMARY KEY,
  search_id        INTEGER NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  rank             SMALLINT NOT NULL,
  journey_json     JSONB NOT NULL,   -- full Journey object from journey-engine
  journey_quality  NUMERIC(5,2),
  booking_viability TEXT,            -- 'high'|'medium'|'low'|'unknown'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_search_results_search ON search_results (search_id);
```

## Haversine helper (for origin/destination expansion — "stations within 100km")
```sql
CREATE OR REPLACE FUNCTION haversine_km(
  lat1 DOUBLE PRECISION, lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION, lng2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
  SELECT 6371 * acos(
    LEAST(1.0, GREATEST(-1.0,
      cos(radians(lat1)) * cos(radians(lat2)) *
      cos(radians(lng2) - radians(lng1)) +
      sin(radians(lat1)) * sin(radians(lat2))
    ))
  );
$$ LANGUAGE sql IMMUTABLE;
```
Usage: `SELECT * FROM stations WHERE haversine_km(lat, lng, :targetLat, :targetLng) <= 100;`

## Migration files
`infrastructure/migrations/001_init.sql` contains the base schema.
`002_add_expansion_columns.sql` adds `searches.expanded_origins` /
`expanded_destinations`. Add `003_*.sql` etc. for future changes —
never edit an already-applied migration once it has run anywhere real.
