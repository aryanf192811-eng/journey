// packages/journey-engine/src/__tests__/ranking.test.ts
// paretoFilter is pure (no DB, no pathfinder) — build minimal Journey
// fixtures directly rather than running the full pipeline.

import { describe, it, expect } from 'vitest';
import { paretoFilter } from '../ranking';
import { Journey } from '../types';

function journey(overrides: Partial<Journey>): Journey {
  return {
    legs: [],
    totalFareEstimate: 1000,
    totalDurationMinutes: 600,
    transferCount: 0,
    connectionBuffers: [],
    departureTime: '2026-11-16T20:00:00.000Z',
    arrivalTime: '2026-11-17T06:00:00.000Z',
    journeyQualityScore: 80,
    bookingViability: 'unknown',
    whyThisRoute: ['test'],
    cautions: [],
    ...overrides,
  };
}

describe('paretoFilter', () => {
  it('drops a journey strictly dominated on every axis', () => {
    const dominated = journey({ totalFareEstimate: 1200, totalDurationMinutes: 700, transferCount: 1 });
    const dominant = journey({ totalFareEstimate: 1000, totalDurationMinutes: 600, transferCount: 0 });

    const survivors = paretoFilter([dominated, dominant]);

    expect(survivors).toEqual([dominant]);
  });

  it('keeps both journeys when each wins on a different axis (a real trade-off)', () => {
    const cheaperButSlower = journey({ totalFareEstimate: 900, totalDurationMinutes: 800 });
    const fasterButPricier = journey({ totalFareEstimate: 1500, totalDurationMinutes: 500 });

    const survivors = paretoFilter([cheaperButSlower, fasterButPricier]);

    expect(survivors).toHaveLength(2);
  });

  it('keeps a journey with a worse connection-risk badge only if nothing dominates it', () => {
    const riskyButCheaper = journey({
      totalFareEstimate: 800,
      connectionBuffers: [{ atStationCode: 'NDLS', minutes: 45, risk: 'yellow', reason: 'tight' }],
    });
    const safeButPricier = journey({
      totalFareEstimate: 1000,
      connectionBuffers: [{ atStationCode: 'NDLS', minutes: 180, risk: 'green', reason: 'comfortable' }],
    });

    const survivors = paretoFilter([riskyButCheaper, safeButPricier]);

    expect(survivors).toHaveLength(2); // riskyButCheaper wins on fare, safeButPricier wins on risk
  });
});
