-- infrastructure/seed/001_stations.sql
-- A small but real subset of Indian Railways stations covering the
-- PRD's own example route plus enough of a network to exercise
-- multi-leg search meaningfully. Extend as needed — see docs/DB.md.

INSERT INTO stations (code, name, city, state, lat, lng) VALUES
  ('BRC',  'Vadodara Junction',      'Vadodara',    'Gujarat',        22.3072, 73.1812),
  ('ADI',  'Ahmedabad Junction',     'Ahmedabad',   'Gujarat',        23.0225, 72.5714),
  ('ST',   'Surat',                  'Surat',       'Gujarat',        21.1959, 72.8302),
  ('NDLS', 'New Delhi',              'Delhi',       'Delhi',          28.6430, 77.2194),
  ('KOTA', 'Kota Junction',          'Kota',        'Rajasthan',      25.1801, 75.8433),
  ('MFP',  'Muzaffarpur Junction',   'Muzaffarpur', 'Bihar',          26.1197, 85.3910),
  ('PNBE', 'Patna Junction',         'Patna',       'Bihar',          25.6100, 85.1416),
  ('DBG',  'Darbhanga Junction',     'Darbhanga',   'Bihar',          26.1542, 85.8918),
  ('GKP',  'Gorakhpur Junction',     'Gorakhpur',   'Uttar Pradesh',  26.7606, 83.3732),
  ('BJU',  'Barauni Junction',       'Begusarai',   'Bihar',          25.4622, 86.0308);

INSERT INTO station_aliases (station_id, alias)
SELECT id, 'Baroda' FROM stations WHERE code = 'BRC';
INSERT INTO station_aliases (station_id, alias)
SELECT id, 'Delhi' FROM stations WHERE code = 'NDLS';
