// packages/journey-engine/src/index.ts
// Public entrypoint — orchestrates the full pipeline described in
// docs/ARCHITECTURE.md and the PRD's search pipeline diagram.

import { buildTemporalGraph, RawTrainStop, RawFare } from './graph-builder';
import { findTemporalPaths } from './temporal-pathfinder';
import { assembleJourney, rankJourneys } from './ranking';
import { LegAvailabilitySignal } from './viability';
import { Journey, SearchConstraints, DEFAULT_CONSTRAINTS } from './types';

export * from './types';
export { buildTemporalGraph } from './graph-builder';
export { findTemporalPaths } from './temporal-pathfinder';
export { rankJourneys, paretoFilter, assembleJourney } from './ranking';
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
   * package free of DB access (see docs/ARCHITECTURE.md). */
  getAvailabilitySignal: (trainNumber: string, classCode: string) => LegAvailabilitySignal;
}

const MAX_JOURNEY_DAYS = 4; // reasonable ceiling for an Indian long-distance journey incl. transfers

/** Runs the full deterministic pipeline: build graph -> find paths ->
 * validate connections -> assemble journeys -> Pareto-filter -> rank.
 * This is the one function apps/api should call for a search request. */
export function searchJourneys(input: SearchInput): Journey[] {
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

  const journeys: Journey[] = [];
  for (const candidate of candidates) {
    const signals = candidate.edges.map((e) =>
      input.getAvailabilitySignal(e.trainNumber, e.classCode)
    );
    const journey = assembleJourney(candidate, constraints, signals);
    if (journey) journeys.push(journey);
  }

  return rankJourneys(journeys);
}
