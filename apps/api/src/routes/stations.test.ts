// apps/api/src/routes/stations.test.ts
// Short-query short-circuit happens before any DB call — no mocking needed.

import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { stationRoutes } from './stations';

describe('GET /api/stations/search', () => {
  it('returns an empty list for a query shorter than 2 chars, without hitting the DB', async () => {
    const app = Fastify();
    await app.register(stationRoutes);

    const res = await app.inject({ method: 'GET', url: '/api/stations/search?q=b' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ stations: [] });
  });
});
