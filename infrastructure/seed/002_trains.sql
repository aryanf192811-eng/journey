-- infrastructure/seed/002_trains.sql
-- Illustrative schedules (not scraped, not guaranteed to match real
-- IRCTC timetables — replace with real/authorized data before relying
-- on this for actual trip planning). Enough structure to demonstrate
-- direct + multi-leg + destination-expansion search.

-- Direct-ish long train, BRC -> MFP via multiple days (deliberately
-- sparse seats / high fare relative to the split option, so ranking
-- has something interesting to compare against).
INSERT INTO trains (number, name, runs_on_days) VALUES
  ('19484', 'Sabarmati Muzaffarpur Express', '{1,4}');
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, day_offset, distance_km)
SELECT t.id, s.id, 1, NULL, '17:30:00', 0, 0 FROM trains t, stations s WHERE t.number='19484' AND s.code='BRC';
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, day_offset, distance_km)
SELECT t.id, s.id, 2, '19:00:00', NULL, 2, 1650 FROM trains t, stations s WHERE t.number='19484' AND s.code='MFP';
INSERT INTO train_classes (train_id, class_code, base_fare)
SELECT id, 'SL', 720 FROM trains WHERE number='19484';
INSERT INTO train_classes (train_id, class_code, base_fare)
SELECT id, '3A', 1890 FROM trains WHERE number='19484';

-- Leg A: BRC -> NDLS overnight (Gujarat Mail style)
INSERT INTO trains (number, name, runs_on_days) VALUES
  ('12902', 'Gujarat Mail', '{0,1,2,3,4,5,6}');
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, day_offset, distance_km)
SELECT t.id, s.id, 1, NULL, '20:05:00', 0, 0 FROM trains t, stations s WHERE t.number='12902' AND s.code='BRC';
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, day_offset, distance_km)
SELECT t.id, s.id, 2, '08:35:00', NULL, 1, 935 FROM trains t, stations s WHERE t.number='12902' AND s.code='NDLS';
INSERT INTO train_classes (train_id, class_code, base_fare) SELECT id, 'SL', 480 FROM trains WHERE number='12902';
INSERT INTO train_classes (train_id, class_code, base_fare) SELECT id, '3A', 1250 FROM trains WHERE number='12902';

-- Leg B: NDLS -> MFP, comfortable connection (~3h buffer)
INSERT INTO trains (number, name, runs_on_days) VALUES
  ('12565', 'Bihar Sampark Kranti', '{0,1,2,3,4,5,6}');
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, day_offset, distance_km)
SELECT t.id, s.id, 1, NULL, '11:40:00', 1, 0 FROM trains t, stations s WHERE t.number='12565' AND s.code='NDLS';
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, day_offset, distance_km)
SELECT t.id, s.id, 2, '05:00:00', NULL, 2, 1000 FROM trains t, stations s WHERE t.number='12565' AND s.code='MFP';
INSERT INTO train_classes (train_id, class_code, base_fare) SELECT id, 'SL', 460 FROM trains WHERE number='12565';
INSERT INTO train_classes (train_id, class_code, base_fare) SELECT id, '3A', 980 FROM trains WHERE number='12565';

-- Leg B alt: NDLS -> MFP, TIGHT connection if paired same-day with 12902
-- (demonstrates the connection-risk model correctly flagging/rejecting it)
INSERT INTO trains (number, name, runs_on_days) VALUES
  ('12556', 'Gorakhdham Express', '{0,1,2,3,4,5,6}');
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, day_offset, distance_km)
SELECT t.id, s.id, 1, NULL, '08:50:00', 1, 0 FROM trains t, stations s WHERE t.number='12556' AND s.code='NDLS';
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, day_offset, distance_km)
SELECT t.id, s.id, 2, '02:10:00', NULL, 2, 1010 FROM trains t, stations s WHERE t.number='12556' AND s.code='MFP';
INSERT INTO train_classes (train_id, class_code, base_fare) SELECT id, 'SL', 450 FROM trains WHERE number='12556';
INSERT INTO train_classes (train_id, class_code, base_fare) SELECT id, '3A', 960 FROM trains WHERE number='12556';

-- Alternate route via Kota (origin-expansion / route-diversity example)
INSERT INTO trains (number, name, runs_on_days) VALUES
  ('12904', 'Golden Temple Mail', '{0,1,2,3,4,5,6}');
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, day_offset, distance_km)
SELECT t.id, s.id, 1, NULL, '21:15:00', 0, 0 FROM trains t, stations s WHERE t.number='12904' AND s.code='BRC';
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, day_offset, distance_km)
SELECT t.id, s.id, 2, '04:40:00', '04:50:00', 1, 460 FROM trains t, stations s WHERE t.number='12904' AND s.code='KOTA';
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, day_offset, distance_km)
SELECT t.id, s.id, 3, '09:20:00', NULL, 1, 940 FROM trains t, stations s WHERE t.number='12904' AND s.code='NDLS';
INSERT INTO train_classes (train_id, class_code, base_fare) SELECT id, 'SL', 510 FROM trains WHERE number='12904';
INSERT INTO train_classes (train_id, class_code, base_fare) SELECT id, '3A', 1320 FROM trains WHERE number='12904';

-- Destination-expansion example: NDLS -> Darbhanga (near Muzaffarpur)
INSERT INTO trains (number, name, runs_on_days) VALUES
  ('12522', 'Rajya Rani Express', '{0,1,2,3,4,5,6}');
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, day_offset, distance_km)
SELECT t.id, s.id, 1, NULL, '15:35:00', 1, 0 FROM trains t, stations s WHERE t.number='12522' AND s.code='NDLS';
INSERT INTO train_stops (train_id, station_id, stop_sequence, arrival_time, departure_time, day_offset, distance_km)
SELECT t.id, s.id, 2, '08:20:00', NULL, 2, 1080 FROM trains t, stations s WHERE t.number='12522' AND s.code='DBG';
INSERT INTO train_classes (train_id, class_code, base_fare) SELECT id, 'SL', 470 FROM trains WHERE number='12522';
INSERT INTO train_classes (train_id, class_code, base_fare) SELECT id, '3A', 1010 FROM trains WHERE number='12522';
