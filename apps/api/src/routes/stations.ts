// apps/api/src/routes/stations.ts

import { FastifyInstance } from 'fastify';
import { searchStations } from '../modules/stations';

export async function stationRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { q?: string } }>('/api/stations/search', async (req, reply) => {
    const q = req.query.q?.trim();
    if (!q || q.length < 2) return reply.send({ stations: [] });
    const stations = await searchStations(q);
    return reply.send({ stations });
  });
}
