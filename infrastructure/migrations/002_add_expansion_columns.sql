-- 002_add_expansion_columns.sql
-- expandedOrigins/expandedDestinations were computed on POST but never
-- persisted, so GET /api/journeys/search/:searchId (page refresh) lost
-- them and the UI.md-mandated expansion banner could never render.
-- See docs/DB.md.

ALTER TABLE searches
  ADD COLUMN expanded_origins JSONB,
  ADD COLUMN expanded_destinations JSONB;
