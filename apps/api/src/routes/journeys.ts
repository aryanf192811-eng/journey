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

    const journeys = await runJourneySearch({
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
    // (see PRD "the system should also understand 'nearby'").
    let expandedDestinations: { stationCode: string; extraTravelMinutes: number }[] | undefined;
    let expandedOrigins: { stationCode: string; extraTravelMinutes: number }[] | undefined;

    if (journeys.length < 3 && body.allowDestExpansion !== false) {
      const nearby = await nearbyStations(destinationCode);
      expandedDestinations = nearby.map((s) => ({ stationCode: s.code, extraTravelMinutes: 0 })); // TODO: real last-mile estimate, V1.1
    }
    if (journeys.length < 3 && body.allowOriginExpansion !== false) {
      const nearby = await nearbyStations(originCode);
      expandedOrigins = nearby.map((s) => ({ stationCode: s.code, extraTravelMinutes: 0 }));
    }

    const searchRow = await query<{ id: number }>(
      `INSERT INTO searches
        (origin_station_id, dest_station_id, date_from, date_to, budget_max, classes, max_transfers, passengers)
       VALUES (
        (SELECT id FROM stations WHERE code = $1),
        (SELECT id FROM stations WHERE code = $2),
        $3, $4, $5, $6, $7, $8)
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
    const rows = await query<{ journey_json: any }>(
      `SELECT journey_json FROM search_results WHERE search_id = $1 ORDER BY rank ASC`,
      [req.params.searchId]
    );
    if (rows.length === 0) return reply.code(404).send({ error: 'search not found' });
    return reply.send({ journeys: rows.map((r) => r.journey_json) });
  });
}
