// apps/api/src/modules/journey-search.ts
// Fetches raw schedule/fare rows from Postgres and hands them to
// journey-engine (which does zero I/O itself — see ARCHITECTURE.md).

import { query } from '../infrastructure/db';
import { fetchSeatAvailability } from '../infrastructure/railradar';
import {
  searchJourneys,
  RawTrainStop,
  RawFare,
  LegAvailabilitySignal,
  Journey,
} from '@travel-intelligence/journey-engine';

interface SearchParams {
  originCode: string;
  destinationCode: string;
  dateFrom: Date;
  dateTo: Date;
  budgetMax?: number;
  classes: string[];
  maxTransfers: number;
}

export async function runJourneySearch(params: SearchParams): Promise<Journey[]> {
  const stops = await fetchAllStops();
  const fares = await fetchAllFares();

  return searchJourneys({
    originStationCode: params.originCode,
    destinationStationCode: params.destinationCode,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    budgetMax: params.budgetMax,
    classes: params.classes,
    maxTransfers: params.maxTransfers,
    stops,
    fares,
    getAvailabilitySignal: getLiveAvailabilitySignal,
  });
}

/** Live lookup via RailRadar (see apps/api/src/infrastructure/railradar.ts).
 * Degrades to the honest "unknown" whenever RAILRADAR_API_KEY is unset or
 * the call fails — never fabricates a probability (see PRD non-goals). */
async function getLiveAvailabilitySignal(leg: {
  trainNumber: string;
  classCode: string;
  fromStationCode: string;
  toStationCode: string;
  departureDate: Date;
}): Promise<LegAvailabilitySignal> {
  const { status, wlNumber } = await fetchSeatAvailability(leg);
  return { trainNumber: leg.trainNumber, classCode: leg.classCode, status, wlNumber };
}

// V1: loads the whole schedule graph into memory per request. Fine for
// a seed dataset of a few hundred trains (see PRD success criteria);
// revisit with a cached/pre-built graph (Redis or in-process cache with
// TTL) if this becomes the bottleneck — see ARCHITECTURE.md.
async function fetchAllStops(): Promise<RawTrainStop[]> {
  const rows = await query<{
    train_number: string;
    train_name: string;
    runs_on_days: number[];
    station_code: string;
    stop_sequence: number;
    arrival_time: string | null;
    departure_time: string | null;
    day_offset: number;
  }>(
    `SELECT t.number AS train_number, t.name AS train_name, t.runs_on_days,
            s.code AS station_code, ts.stop_sequence, ts.arrival_time,
            ts.departure_time, ts.day_offset
     FROM train_stops ts
     JOIN trains t ON t.id = ts.train_id
     JOIN stations s ON s.id = ts.station_id
     ORDER BY t.number, ts.stop_sequence`
  );

  return rows.map((r) => ({
    trainNumber: r.train_number,
    trainName: r.train_name,
    runsOnDays: r.runs_on_days,
    stationCode: r.station_code,
    stopSequence: r.stop_sequence,
    arrivalTime: r.arrival_time,
    departureTime: r.departure_time,
    dayOffset: r.day_offset,
  }));
}

async function fetchAllFares(): Promise<RawFare[]> {
  const rows = await query<{ train_number: string; class_code: string; base_fare: string }>(
    `SELECT t.number AS train_number, tc.class_code, tc.base_fare
     FROM train_classes tc
     JOIN trains t ON t.id = tc.train_id`
  );
  return rows.map((r) => ({
    trainNumber: r.train_number,
    classCode: r.class_code,
    baseFare: Number(r.base_fare),
  }));
}
