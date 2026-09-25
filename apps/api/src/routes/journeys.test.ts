// apps/api/src/routes/journeys.test.ts
// Validation happens before any DB/journey-engine call in journeyRoutes,
// so these run against a real Fastify instance with no mocking needed.
// computeExtraTravelMinutes is a pure helper, tested directly.

import { describe, it, expect, vi } from 'vitest';
import Fastify from 'fastify';
import { journeyRoutes, computeExtraTravelMinutes } from './journeys';
import { query } from '../infrastructure/db';

vi.mock('../infrastructure/db', () => ({ query: vi.fn() }));
const mockQuery = vi.mocked(query);

describe('computeExtraTravelMinutes', () => {
  it('estimates minutes from distance at the assumed 30km/h last-mile speed', () => {
    expect(computeExtraTravelMinutes(30)).toBe(60);
    expect(computeExtraTravelMinutes(15)).toBe(30);
  });

  it('returns 0 for a co-located station', () => {
    expect(computeExtraTravelMinutes(0)).toBe(0);
  });
});

describe('POST /api/journeys/search validation', () => {
  async function buildApp() {
    const app = Fastify();
    await app.register(journeyRoutes);
    return app;
  }

  it('rejects a request missing origin/destination', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/journeys/search',
      payload: { dateFrom: '2026-11-16', dateTo: '2026-11-20', classes: ['3A'] },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/origin and destination/);
  });

  it('rejects a request missing dates', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/journeys/search',
      payload: { origin: 'BRC', destination: 'MFP', classes: ['3A'] },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/dateFrom and dateTo/);
  });

  it('rejects a request missing classes', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/journeys/search',
      payload: { origin: 'BRC', destination: 'MFP', dateFrom: '2026-11-16', dateTo: '2026-11-20', classes: [] },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().field).toBe('classes');
  });
});

describe('GET /api/journeys/search/:searchId', () => {
  async function buildApp() {
    const app = Fastify();
    await app.register(journeyRoutes);
    return app;
  }

  it('returns 200 with an empty journeys list when the search exists but found nothing (not a 404)', async () => {
    mockQuery
      .mockResolvedValueOnce([{ expanded_origins: null, expanded_destinations: null }]) // searches lookup
      .mockResolvedValueOnce([]); // search_results lookup — legitimately empty

    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/journeys/search/1' });

    expect(res.statusCode).toBe(200);
    expect(res.json().journeys).toEqual([]);
  });

  it('returns 404 only when the search itself does not exist', async () => {
    mockQuery.mockResolvedValueOnce([]); // no matching searches row

    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/journeys/search/999' });

    expect(res.statusCode).toBe(404);
  });

  it('returns persisted expansion data alongside journeys', async () => {
    const expandedDestinations = [{ stationCode: 'ADI', extraTravelMinutes: 40 }];
    mockQuery
      .mockResolvedValueOnce([{ expanded_origins: null, expanded_destinations: expandedDestinations }])
      .mockResolvedValueOnce([{ journey_json: { totalFareEstimate: 900 } }]);

    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/journeys/search/1' });

    expect(res.statusCode).toBe(200);
    expect(res.json().expandedDestinations).toEqual(expandedDestinations);
  });
});
