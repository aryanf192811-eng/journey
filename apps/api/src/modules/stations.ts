// apps/api/src/modules/stations.ts
// Station resolution + autocomplete. See docs/API.md GET /api/stations/search.

import { query } from '../infrastructure/db';

export interface StationRow {
  code: string;
  name: string;
  city: string;
  state: string;
}

export async function searchStations(q: string): Promise<StationRow[]> {
  return query<StationRow>(
    `SELECT DISTINCT s.code, s.name, s.city, s.state
     FROM stations s
     LEFT JOIN station_aliases a ON a.station_id = s.id
     WHERE s.name ILIKE $1 OR s.city ILIKE $1 OR s.code ILIKE $1 OR a.alias ILIKE $1
     LIMIT 10`,
    [`%${q}%`]
  );
}

/** Resolves a free-text or code input to a canonical station code.
 * Throws if nothing matches — caller returns 404. */
export async function resolveStationCode(input: string): Promise<string> {
  const exact = await query<{ code: string }>(
    `SELECT code FROM stations WHERE code = $1`,
    [input.toUpperCase()]
  );
  if (exact.length > 0) return exact[0].code;

  const matches = await searchStations(input);
  if (matches.length === 0) {
    throw new Error(`No station found matching "${input}"`);
  }
  return matches[0].code;
}

export interface NearbyStationRow extends StationRow {
  distanceKm: number;
}

/** Stations within radiusKm of a given station, for origin/destination
 * expansion (see PRD "The system should also understand 'nearby'"). */
export async function nearbyStations(stationCode: string, radiusKm = 100): Promise<NearbyStationRow[]> {
  const rows = await query<StationRow & { distance_km: number }>(
    `SELECT s2.code, s2.name, s2.city, s2.state,
            haversine_km(s1.lat, s1.lng, s2.lat, s2.lng) AS distance_km
     FROM stations s1
     JOIN stations s2 ON s2.code != s1.code
       AND haversine_km(s1.lat, s1.lng, s2.lat, s2.lng) <= $2
     WHERE s1.code = $1
     ORDER BY distance_km ASC
     LIMIT 5`,
    [stationCode, radiusKm]
  );
  return rows.map((r) => ({ ...r, distanceKm: Number(r.distance_km) }));
}
