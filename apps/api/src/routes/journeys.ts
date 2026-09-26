// apps/api/src/routes/journeys.ts
// See docs/API.md for the full contract.

import { FastifyInstance } from 'fastify';
import { query } from '../infrastructure/db';
import { resolveStationCode, nearbyStations } from '../modules/stations';
import { runJourneySearch } from '../modules/journey-search';

interface SearchBody {
  origin: string;
  destination: string;
  dateFrom: string;
  dateTo: string;
  budgetMax?: number;
  classes: string[];
  maxTransfers?: number;
  passengers?: number;
  allowOriginExpansion?: boolean;
  allowDestExpansion?: boolean;
}

// ponytail: flat assumed last-mile road speed, no maps/traffic API — good
// enough for "roughly how much extra travel" framing; upgrade to a real
// maps API if this needs to be precise rather than indicative.
const ASSUMED_LAST_MILE_SPEED_KMH = 30;

export function computeExtraTravelMinutes(distanceKm: number): number {
  return Math.round((distanceKm / ASSUMED_LAST_MILE_SPEED_KMH) * 60);
}

// ponytail: bounded, not exhaustive — re-running the full search per nearby
// station is real DB + RailRadar cost (see docs/ARCHITECTURE.md). Trying
// every combination of nearby origins x nearby destinations would be
// O(n*m) searches; capping each side and only combining as a last resort
// keeps this from blowing up while still surfacing the "special train
// between two alternate stations" case neither single-side expansion finds.
const MAX_NEARBY_STATIONS_TO_SEARCH = 3;
const MIN_RESULTS_BEFORE_EXPANDING = 3;

export async function journeyRoutes(app: FastifyInstance) {
  app.post<{ Body: SearchBody }>('/api/journeys/search', async (req, reply) => {
    const body = req.body;

    if (!body.origin || !body.destination) {
      return reply.code(400).send({ error: 'origin and destination are required' });
    }
    if (!body.dateFrom || !body.dateTo) {
      return reply.code(400).send({ error: 'dateFrom and dateTo are required' });
    }
    if (!body.classes || body.classes.length === 0) {
      return reply.code(400).send({ error: 'at least one class is required', field: 'classes' });
    }

    let originCode: string, destinationCode: string;
    try {
      originCode = await resolveStationCode(body.origin);
      destinationCode = await resolveStationCode(body.destination);
    } catch (err: any) {
      return reply.code(404).send({ error: err.message });
    }

    const dateFrom = new Date(`${body.dateFrom}T00:00:00`);
    const dateTo = new Date(`${body.dateTo}T00:00:00`);
    const maxTransfers = body.maxTransfers ?? 2;

    let journeys = await runJourneySearch({
      originCode,
      destinationCode,
      dateFrom,
      dateTo,
      budgetMax: body.budgetMax,
      classes: body.classes,
      maxTransfers,
    });

    // Origin/destination expansion — only run, and only labeled as such,
    // when the direct search came back thin. Never silently substitute
    // (see PRD "the system should also understand 'nearby'"). This
    // actually re-searches from/to nearby stations (not just suggests
    // them) so a train that only serves an alternate station — including
    // one that connects an alternate ORIGIN to an alternate DESTINATION —
    // gets surfaced, each journey carrying the real extra travel time.
    let expandedDestinations: { stationCode: string; extraTravelMinutes: number }[] | undefined;
    let expandedOrigins: { stationCode: string; extraTravelMinutes: number }[] | undefined;

    if (journeys.length < MIN_RESULTS_BEFORE_EXPANDING && body.allowDestExpansion !== false) {
      const nearby = await nearbyStations(destinationCode);
      expandedDestinations = nearby.map((s) => ({
        stationCode: s.code,
        extraTravelMinutes: computeExtraTravelMinutes(s.distanceKm),
      }));
    }
    if (journeys.length < MIN_RESULTS_BEFORE_EXPANDING && body.allowOriginExpansion !== false) {
      const nearby = await nearbyStations(originCode);
      expandedOrigins = nearby.map((s) => ({
        stationCode: s.code,
        extraTravelMinutes: computeExtraTravelMinutes(s.distanceKm),
      }));
    }

    if (journeys.length < MIN_RESULTS_BEFORE_EXPANDING && (expandedDestinations?.length || expandedOrigins?.length)) {
      const searchExpansion = async (
        oCode: string,
        dCode: string,
        originExtra: number | undefined,
        destExtra: number | undefined
      ) => {
        const extra = await runJourneySearch({
          originCode: oCode,
          destinationCode: dCode,
          dateFrom,
          dateTo,
          budgetMax: body.budgetMax,
          classes: body.classes,
          maxTransfers,
        });
        for (const j of extra) {
          if (originExtra !== undefined) {
            j.isOriginExpansion = true;
            j.originExtraTravelMinutes = originExtra;
          }
          if (destExtra !== undefined) {
            j.isDestinationExpansion = true;
            j.destExtraTravelMinutes = destExtra;
          }
        }
        return extra;
      };

      const sideTasks = [
        ...(expandedDestinations ?? [])
          .slice(0, MAX_NEARBY_STATIONS_TO_SEARCH)
          .map((d) => searchExpansion(originCode, d.stationCode, undefined, d.extraTravelMinutes)),
        ...(expandedOrigins ?? [])
          .slice(0, MAX_NEARBY_STATIONS_TO_SEARCH)
          .map((o) => searchExpansion(o.stationCode, destinationCode, o.extraTravelMinutes, undefined)),
      ];
      for (const found of await Promise.all(sideTasks)) journeys.push(...found);

      // Still thin after trying each side independently — a special train
      // may only connect an alternate origin to an alternate destination
      // (neither exact endpoint has a direct/short-transfer service).
      if (journeys.length < MIN_RESULTS_BEFORE_EXPANDING && expandedOrigins?.length && expandedDestinations?.length) {
        const combined = await searchExpansion(
          expandedOrigins[0].stationCode,
          expandedDestinations[0].stationCode,
          expandedOrigins[0].extraTravelMinutes,
          expandedDestinations[0].extraTravelMinutes
        );
        journeys.push(...combined);
      }

      // Sort only — do NOT re-run Pareto-filtering across the merged set.
      // paretoFilter compares fare/duration/transfers/risk as if journeys
      // were interchangeable, which only holds within one origin/destination
      // pair; each runJourneySearch call above already Pareto-filtered its
      // own exact-endpoint results internally. Cross-filtering here would
      // let a cheaper direct journey to the EXACT destination silently
      // eliminate a legitimate journey to a nearby alternate destination —
      // exactly the "never silently substitute" rule this feature exists
      // to uphold.
      journeys.sort((a, b) => b.journeyQualityScore - a.journeyQualityScore);
    }

    const searchRow = await query<{ id: number }>(
      `INSERT INTO searches
        (origin_station_id, dest_station_id, date_from, date_to, budget_max, classes, max_transfers, passengers,
         expanded_origins, expanded_destinations)
       VALUES (
        (SELECT id FROM stations WHERE code = $1),
        (SELECT id FROM stations WHERE code = $2),
        $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        originCode,
        destinationCode,
        body.dateFrom,
        body.dateTo,
        body.budgetMax ?? null,
        body.classes,
        maxTransfers,
        body.passengers ?? 1,
        expandedOrigins ? JSON.stringify(expandedOrigins) : null,
        expandedDestinations ? JSON.stringify(expandedDestinations) : null,
      ]
    );
    const searchId = searchRow[0].id;

    for (let i = 0; i < journeys.length; i++) {
      const j = journeys[i];
      await query(
        `INSERT INTO search_results (search_id, rank, journey_json, journey_quality, booking_viability)
         VALUES ($1, $2, $3, $4, $5)`,
        [searchId, i + 1, JSON.stringify(j), j.journeyQualityScore, j.bookingViability]
      );
    }

    return reply.send({
      searchId,
      query: { originCode, destinationCode, dateFrom: body.dateFrom, dateTo: body.dateTo },
      journeys,
      expandedOrigins,
      expandedDestinations,
    });
  });

  app.get<{ Params: { searchId: string } }>('/api/journeys/search/:searchId', async (req, reply) => {
    const searchRows = await query<{ expanded_origins: any; expanded_destinations: any }>(
      `SELECT expanded_origins, expanded_destinations FROM searches WHERE id = $1`,
      [req.params.searchId]
    );
    if (searchRows.length === 0) return reply.code(404).send({ error: 'search not found' });

    const resultRows = await query<{ journey_json: any }>(
      `SELECT journey_json FROM search_results WHERE search_id = $1 ORDER BY rank ASC`,
      [req.params.searchId]
    );

    return reply.send({
      journeys: resultRows.map((r) => r.journey_json),
      expandedOrigins: searchRows[0].expanded_origins ?? undefined,
      expandedDestinations: searchRows[0].expanded_destinations ?? undefined,
    });
  });
}
