// apps/api/src/infrastructure/railradar.test.ts
// parseAvailabilityStatus is pure — no network, no key needed.

import { describe, it, expect } from 'vitest';
import { parseAvailabilityStatus } from './railradar';

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
