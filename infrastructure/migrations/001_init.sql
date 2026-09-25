-- 001_init.sql — V1 schema. See docs/DB.md for rationale.

CREATE TABLE stations (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(10) UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stations_city ON stations (city);

CREATE TABLE station_aliases (
  id          SERIAL PRIMARY KEY,
  station_id  INTEGER NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  alias       TEXT NOT NULL
);
CREATE INDEX idx_station_aliases_alias ON station_aliases (lower(alias));

CREATE TABLE trains (
  id            SERIAL PRIMARY KEY,
  number        VARCHAR(10) UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  runs_on_days  SMALLINT[] NOT NULL
);

CREATE TABLE train_stops (
  id              SERIAL PRIMARY KEY,
  train_id        INTEGER NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
  station_id      INTEGER NOT NULL REFERENCES stations(id),
  stop_sequence   SMALLINT NOT NULL,
  arrival_time    TIME,
  departure_time  TIME,
  day_offset      SMALLINT NOT NULL DEFAULT 0,
  distance_km     INTEGER,
  UNIQUE (train_id, stop_sequence)
);
CREATE INDEX idx_train_stops_station ON train_stops (station_id);
CREATE INDEX idx_train_stops_train ON train_stops (train_id, stop_sequence);

CREATE TABLE train_classes (
  id          SERIAL PRIMARY KEY,
  train_id    INTEGER NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
  class_code  VARCHAR(4) NOT NULL,
  base_fare   NUMERIC(8,2) NOT NULL,
  UNIQUE (train_id, class_code)
);

CREATE TABLE availability_snapshots (
  id            SERIAL PRIMARY KEY,
  train_id      INTEGER NOT NULL REFERENCES trains(id),
  class_code    VARCHAR(4) NOT NULL,
  journey_date  DATE NOT NULL,
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT NOT NULL,
  wl_number     INTEGER
);
CREATE INDEX idx_avail_train_date ON availability_snapshots (train_id, journey_date, class_code);

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
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE search_results (
  id                SERIAL PRIMARY KEY,
  search_id         INTEGER NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  rank              SMALLINT NOT NULL,
  journey_json      JSONB NOT NULL,
  journey_quality   NUMERIC(5,2),
  booking_viability TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_search_results_search ON search_results (search_id);

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
