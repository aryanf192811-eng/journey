// packages/journey-engine/src/index.ts
// Public entrypoint — orchestrates the full pipeline described in
// docs/ARCHITECTURE.md and the PRD's search pipeline diagram.

import { buildTemporalGraph, RawTrainStop, RawFare } from './graph-builder';
import { findTemporalPaths } from './temporal-pathfinder';
import { assembleJourney, rankJourneys, populateAvailability } from './ranking';
import { LegAvailabilitySignal } from './viability';
import { Journey, SearchConstraints, DEFAULT_CONSTRAINTS } from './types';

export * from './types';
export { buildTemporalGraph } from './graph-builder';
export { findTemporalPaths } from './temporal-pathfinder';
export { rankJourneys, paretoFilter, assembleJourney, populateAvailability } from './ranking';
export { estimateViability } from './viability';
export type { RawTrainStop, RawFare } from './graph-builder';
export type { LegAvailabilitySignal } from './viability';

export interface SearchInput {
  originStationCode: string;
  destinationStationCode: string;
  /** Flexible departure window the user gave (e.g. 16–20 Nov). Only the
   * FIRST leg's departure is constrained to this window — later legs may
   * land on subsequent calendar days for overnight/multi-day journeys. */
  dateFrom: Date;
  dateTo: Date;
  budgetMax?: number;
  classes: string[];
  maxTransfers: number;
  stops: RawTrainStop[];
  fares: RawFare[];
  /** Longest a whole journey is allowed to take, in days, measured from
   * dateFrom. Bounds the search space; default MAX_JOURNEY_DAYS below. */
  maxJourneyDays?: number;
  /** Looked up per candidate leg by caller-supplied fn — keeps this
   * package free of I/O itself (see docs/ARCHITECTURE.md). May be async
   * (e.g. a live RailRadar lookup) or sync (e.g. always-unknown) — awaited
   * either way. */
  getAvailabilitySignal: (leg: {
    trainNumber: string;
    classCode: string;
    fromStationCode: string;
    toStationCode: string;
    departureDate: Date;
  }) => LegAvailabilitySignal | Promise<LegAvailabilitySignal>;
}

const MAX_JOURNEY_DAYS = 4; // reasonable ceiling for an Indian long-distance journey incl. transfers

/** Runs the full deterministic pipeline: build graph -> find paths ->
 * validate connections -> assemble journeys -> Pareto-filter -> rank.
 * This is the one function apps/api should call for a search request.
 * Async only because getAvailabilitySignal may be (see SearchInput) —
 * the pipeline itself still does zero I/O. */
export async function searchJourneys(input: SearchInput): Promise<Journey[]> {
  const constraints: SearchConstraints = {
    budgetMax: input.budgetMax,
    classes: input.classes,
    maxTransfers: input.maxTransfers,
    ...DEFAULT_CONSTRAINTS,
  };

  const maxJourneyDays = input.maxJourneyDays ?? MAX_JOURNEY_DAYS;
  const latestArrival = new Date(input.dateTo);
  latestArrival.setDate(latestArrival.getDate() + maxJourneyDays);
  latestArrival.setHours(23, 59, 59, 999);

  // Graph must include edges departing after dateTo too (a leg that
  // connects from a train that departed within the window but arrives,
  // or whose *next* leg departs, on a later day) — build out to the
  // same ceiling as latestArrival.
  const graph = buildTemporalGraph(
    input.stops,
    input.fares,
    input.dateFrom,
    latestArrival,
    input.classes
  );

  const candidates = findTemporalPaths(
    graph,
    input.originStationCode,
    input.destinationStationCode,
    input.dateFrom,
    input.dateTo,
    latestArrival,
    constraints
  );

  let journeys: Journey[] = [];
  for (const candidate of candidates) {
    const journey = assembleJourney(candidate, constraints);
    if (journey) journeys.push(journey);
  }

  journeys = rankJourneys(journeys);

  // Fetch availability signals only for the candidates that survive
  // Pareto-filtering, to dramatically reduce API consumption (e.g. RailRadar).
  for (const journey of journeys) {
    const signals = await Promise.all(
      journey.legs.map((l) =>
        input.getAvailabilitySignal({
          trainNumber: l.trainNumber,
          classCode: l.classCode,
          fromStationCode: l.fromStationCode,
          toStationCode: l.toStationCode,
          departureDate: new Date(l.departure),
        })
      )
    );
    populateAvailability(journey, signals, constraints);
  }

  return journeys;
}
