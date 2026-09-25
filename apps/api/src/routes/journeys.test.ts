// apps/api/src/routes/journeys.test.ts
// Validation happens before any DB/journey-engine call in journeyRoutes,
// so these run against a real Fastify instance with no mocking needed.
// computeExtraTravelMinutes is a pure helper, tested directly.

import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { journeyRoutes, computeExtraTravelMinutes } from './journeys';

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
