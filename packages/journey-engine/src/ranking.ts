// packages/journey-engine/src/ranking.ts
// Assembles PathCandidates into full Journey objects, Pareto-filters
// dominated ones, and orders survivors. See PRD "Ranking should NOT
// simply be 'fastest'" and "The final result should explain itself".

import { PathCandidate } from './temporal-pathfinder';
import { buildConnectionBuffers, hasBrokenConnection } from './connection-validator';
import { estimateViability, LegAvailabilitySignal } from './viability';
import { Journey, JourneyLeg, SearchConstraints } from './types';

export function assembleJourney(
  candidate: PathCandidate,
  constraints: SearchConstraints,
  availabilitySignals: LegAvailabilitySignal[]
): Journey | null {
  const buffers = buildConnectionBuffers(candidate, constraints);
  if (hasBrokenConnection(buffers)) return null; // rejected before ranking, per PRD pipeline

  const legs: JourneyLeg[] = candidate.edges.map((e) => ({
    trainNumber: e.trainNumber,
    trainName: e.trainName,
    fromStationCode: e.fromStationCode,
    toStationCode: e.toStationCode,
    departure: e.departure.toISOString(),
    arrival: e.arrival.toISOString(),
    durationMinutes: Math.round((e.arrival.getTime() - e.departure.getTime()) / 60_000),
    classCode: e.classCode,
    fareEstimate: e.fareEstimate,
  }));

  const totalFareEstimate = legs.reduce((s, l) => s + l.fareEstimate, 0);
  const departureTime = legs[0].departure;
  const arrivalTime = legs[legs.length - 1].arrival;
  const totalDurationMinutes = Math.round(
    (new Date(arrivalTime).getTime() - new Date(departureTime).getTime()) / 60_000
  );
  const transferCount = legs.length - 1;

  const worstRisk = buffers.reduce<'green' | 'yellow' | 'red'>((worst, b) => {
    const order = { green: 0, yellow: 1, red: 2 };
    return order[b.risk] > order[worst] ? b.risk : worst;
  }, 'green');

  const bookingViability = estimateViability(availabilitySignals, worstRisk);

  const journeyQualityScore = scoreJourneyQuality(
    totalDurationMinutes,
    totalFareEstimate,
    transferCount,
    worstRisk,
    constraints
  );

  const { whyThisRoute, cautions } = explain(
    totalFareEstimate,
    constraints,
    transferCount,
    buffers,
    bookingViability
  );

  return {
    legs,
    totalFareEstimate,
    totalDurationMinutes,
    transferCount,
    connectionBuffers: buffers,
    departureTime,
    arrivalTime,
    journeyQualityScore,
    bookingViability,
    whyThisRoute,
    cautions,
  };
}

function scoreJourneyQuality(
  durationMin: number,
  fare: number,
  transfers: number,
  worstRisk: 'green' | 'yellow' | 'red',
  constraints: SearchConstraints
): number {
  // Simple deterministic 0-100 score. Weights are tunable, not learned —
  // this is intentionally transparent, not an ML black box (see PRD).
  let score = 100;
  score -= Math.min(40, durationMin / 60); // ~1 point per hour, capped
  score -= transfers * 8;
  score -= worstRisk === 'red' ? 20 : worstRisk === 'yellow' ? 8 : 0;
  if (constraints.budgetMax) {
    const budgetUsedFrac = fare / constraints.budgetMax;
    score -= Math.max(0, budgetUsedFrac - 0.7) * 30; // penalize eating most of the budget
  }
  return Math.max(0, Math.round(score));
}

function explain(
  fare: number,
  constraints: SearchConstraints,
  transfers: number,
  buffers: ReturnType<typeof buildConnectionBuffers>,
  viability: string
): { whyThisRoute: string[]; cautions: string[] } {
  const whyThisRoute: string[] = [];
  const cautions: string[] = [];

  if (constraints.budgetMax !== undefined) {
    whyThisRoute.push(
      fare <= constraints.budgetMax
        ? `Within your ₹${constraints.budgetMax} budget (₹${fare})`
        : ''
    );
  }
  whyThisRoute.push(
    transfers === 0 ? 'Direct train, no transfers' : `${transfers} transfer(s) — within your limit`
  );

  const bestBuffer = buffers.reduce(
    (best, b) => (b.minutes > best ? b.minutes : best),
    0
  );
  if (buffers.length > 0) {
    whyThisRoute.push(`Connection buffer as low as ${Math.min(...buffers.map((b) => b.minutes))}m`);
  }

  if (viability === 'high') whyThisRoute.push('Historically strong availability pattern');
  if (viability === 'unknown') cautions.push('Booking viability unknown — no availability data yet for this train/date/class');
  if (viability === 'low') cautions.push('Low historical availability — consider as a backup option');

  if (transfers > 0) cautions.push('Separate tickets — connection is not protected by the railway');
  for (const b of buffers) {
    if (b.risk === 'yellow') cautions.push(b.reason);
  }

  return { whyThisRoute: whyThisRoute.filter(Boolean), cautions };
}

/** Pareto-dominance filter: drop a journey if another is >= as good on
 * every axis (fare, duration, transfers, risk) and strictly better on
 * at least one. See PRD "The ranking engine" section. */
export function paretoFilter(journeys: Journey[]): Journey[] {
  const riskRank = { green: 0, yellow: 1, red: 2 };
  const worstRiskOf = (j: Journey) =>
    j.connectionBuffers.reduce((w, b) => Math.max(w, riskRank[b.risk]), 0);

  return journeys.filter((candidate) => {
    return !journeys.some((other) => {
      if (other === candidate) return false;
      const betterOrEqual =
        other.totalFareEstimate <= candidate.totalFareEstimate &&
        other.totalDurationMinutes <= candidate.totalDurationMinutes &&
        other.transferCount <= candidate.transferCount &&
        worstRiskOf(other) <= worstRiskOf(candidate);
      const strictlyBetter =
        other.totalFareEstimate < candidate.totalFareEstimate ||
        other.totalDurationMinutes < candidate.totalDurationMinutes ||
        other.transferCount < candidate.transferCount ||
        worstRiskOf(other) < worstRiskOf(candidate);
      return betterOrEqual && strictlyBetter;
    });
  });
}

export function rankJourneys(journeys: Journey[]): Journey[] {
  const survivors = paretoFilter(journeys);
  return survivors.sort((a, b) => b.journeyQualityScore - a.journeyQualityScore);
}
