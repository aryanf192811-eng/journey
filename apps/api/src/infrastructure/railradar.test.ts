// apps/api/src/infrastructure/railradar.test.ts
// parseAvailabilityStatus is pure — no network, no key needed.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseAvailabilityStatus, fetchSeatAvailability } from './railradar';

describe('parseAvailabilityStatus', () => {
  it('parses AVAILABLE', () => {
    expect(parseAvailabilityStatus('AVAILABLE-0042')).toEqual({ status: 'AVAILABLE' });
  });

  it('parses RAC', () => {
    expect(parseAvailabilityStatus('RAC 12')).toEqual({ status: 'RAC' });
  });

  it('parses a waitlist status and extracts the trailing WL number', () => {
    expect(parseAvailabilityStatus('GNWL24/WL11')).toEqual({ status: 'WL', wlNumber: 11 });
  });

  it('parses REGRET/no-quota text', () => {
    expect(parseAvailabilityStatus('REGRET/TRAIN NOT AVAILABLE')).toEqual({ status: 'REGRET' });
  });

  it('falls back to null status for an unrecognized string', () => {
    expect(parseAvailabilityStatus('SOMETHING NEW')).toEqual({ status: null });
  });
});

describe('fetchSeatAvailability failure caching', () => {
  const leg = {
    trainNumber: '12902',
    classCode: 'SL',
    fromStationCode: 'BRC',
    toStationCode: 'NDLS',
    departureDate: new Date('2026-11-16T00:00:00Z'),
  };

  beforeEach(() => {
    process.env.RAILRADAR_API_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) })
    );
  });

  afterEach(() => {
    delete process.env.RAILRADAR_API_KEY;
    vi.unstubAllGlobals();
  });

  it('caches a failed lookup so repeated requests for the same leg do not re-hit the network', async () => {
    const first = await fetchSeatAvailability(leg);
    const second = await fetchSeatAvailability(leg);

    expect(first).toEqual({ status: null });
    expect(second).toEqual({ status: null });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
