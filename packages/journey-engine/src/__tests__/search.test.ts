// packages/journey-engine/src/__tests__/search.test.ts
// Proves the pipeline end-to-end with the PRD's own example: no direct
// train Vadodara(BRC) -> Muzaffarpur(MFP), but a viable 1-transfer
// route via Delhi(NDLS) should be found and correctly explained.

import { describe, it, expect } from 'vitest';
import { searchJourneys, RawTrainStop, RawFare } from '../index';

describe('searchJourneys', () => {
  const stops: RawTrainStop[] = [
    // Train 1: BRC -> NDLS, overnight
    { trainNumber: '12901', trainName: 'Gujarat Mail', runsOnDays: [0,1,2,3,4,5,6],
      stationCode: 'BRC', stopSequence: 1, arrivalTime: null, departureTime: '20:00:00', dayOffset: 0 },
    { trainNumber: '12901', trainName: 'Gujarat Mail', runsOnDays: [0,1,2,3,4,5,6],
      stationCode: 'NDLS', stopSequence: 2, arrivalTime: '08:00:00', departureTime: null, dayOffset: 1 },

    // Train 2: NDLS -> MFP, comfortable 3h40m connection
    { trainNumber: '12565', trainName: 'Bihar Sampark Kranti', runsOnDays: [0,1,2,3,4,5,6],
      stationCode: 'NDLS', stopSequence: 1, arrivalTime: null, departureTime: '11:40:00', dayOffset: 1 },
    { trainNumber: '12565', trainName: 'Bihar Sampark Kranti', runsOnDays: [0,1,2,3,4,5,6],
      stationCode: 'MFP', stopSequence: 2, arrivalTime: '05:00:00', departureTime: null, dayOffset: 2 },

    // Train 3: NDLS -> MFP, dangerously tight connection (only 20 min)
    { trainNumber: '12556', trainName: 'Gorakhdham Express', runsOnDays: [0,1,2,3,4,5,6],
      stationCode: 'NDLS', stopSequence: 1, arrivalTime: null, departureTime: '08:20:00', dayOffset: 1 },
    { trainNumber: '12556', trainName: 'Gorakhdham Express', runsOnDays: [0,1,2,3,4,5,6],
      stationCode: 'MFP', stopSequence: 2, arrivalTime: '02:00:00', departureTime: null, dayOffset: 2 },
  ];

  const fares: RawFare[] = [
    { trainNumber: '12901', classCode: '3A', baseFare: 950 },
    { trainNumber: '12565', classCode: '3A', baseFare: 890 },
    { trainNumber: '12556', classCode: '3A', baseFare: 870 },
  ];

  it('finds the comfortable 1-transfer journey and rejects the broken one', async () => {
    const journeys = await searchJourneys({
      originStationCode: 'BRC',
      destinationStationCode: 'MFP',
      dateFrom: new Date('2026-11-16T00:00:00'),
      dateTo: new Date('2026-11-17T23:59:59'),
      budgetMax: 2500,
      classes: ['3A'],
      maxTransfers: 1,
      maxJourneyDays: 1, // keeps this test scoped to same-window connections
      stops,
      fares,
      getAvailabilitySignal: () => ({ trainNumber: '', classCode: '3A', status: null }),
    });

    expect(journeys.length).toBeGreaterThan(0);
    // No returned journey should ever contain a red (broken) connection —
    // assembleJourney must reject those before they reach ranking.
    expect(journeys.every((j) => j.connectionBuffers.every((b) => b.risk !== 'red'))).toBe(true);

    // The tight-connection route via 12556 must never appear as a result —
    // it should be rejected before ranking, per the PRD pipeline.
    const usesTightTrain = journeys.some((j) =>
      j.legs.some((l) => l.trainNumber === '12556')
    );
    expect(usesTightTrain).toBe(false);

    // The comfortable route should appear and be explained.
    const comfortable = journeys.find((j) =>
      j.legs.some((l) => l.trainNumber === '12565')
    );
    expect(comfortable).toBeDefined();
    expect(comfortable!.connectionBuffers[0].risk).toBe('green');
    expect(comfortable!.whyThisRoute.length).toBeGreaterThan(0);
    expect(comfortable!.bookingViability).toBe('unknown'); // no availability data supplied
  });

  it('respects budget constraint', async () => {
    const journeys = await searchJourneys({
      originStationCode: 'BRC',
      destinationStationCode: 'MFP',
      dateFrom: new Date('2026-11-16T00:00:00'),
      dateTo: new Date('2026-11-17T23:59:59'),
      budgetMax: 1000, // too low for BRC->NDLS (950) + NDLS->MFP (890) = 1840
      classes: ['3A'],
      maxTransfers: 1,
      stops,
      fares,
      getAvailabilitySignal: () => ({ trainNumber: '', classCode: '3A', status: null }),
    });

    expect(journeys.length).toBe(0);
  });
});
