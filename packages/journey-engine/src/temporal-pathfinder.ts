// packages/journey-engine/src/temporal-pathfinder.ts
// Bounded k-shortest-ish temporal path search. Time-respecting DFS with
// aggressive pruning (max legs, budget, deadline) rather than a naive
// full enumeration — see docs/ARCHITECTURE.md / the PRD's "search
// shouldn't blindly explore everything" note.

import { TemporalEdge, SearchConstraints } from './types';

export interface PathCandidate {
  edges: TemporalEdge[];
}

const MAX_LEGS = 3; // => up to 2 transfers
const MAX_CANDIDATES = 200; // hard cap so a dense graph can't blow up the search
const MIN_TRANSFER_MINUTES = 15; // absolute floor before even considering a connection

export function findTemporalPaths(
  graph: Map<string, TemporalEdge[]>,
  originCode: string,
  destinationCode: string,
  earliestDeparture: Date,
  latestFirstLegDeparture: Date,
  latestArrival: Date,
  constraints: SearchConstraints
): PathCandidate[] {
  const results: PathCandidate[] = [];
  const maxLegs = Math.min(MAX_LEGS, constraints.maxTransfers + 1);

  function dfs(currentStation: string, path: TemporalEdge[], notBefore: Date) {
    if (results.length >= MAX_CANDIDATES) return;

    if (currentStation === destinationCode && path.length > 0) {
      results.push({ edges: [...path] });
      // Don't return early — a longer path to the same destination via a
      // different route is still a distinct candidate worth keeping.
    }

    if (path.length >= maxLegs) return;

    const edges = graph.get(currentStation) ?? [];
    for (const edge of edges) {
      if (edge.departure < notBefore) continue;
      if (edge.arrival > latestArrival) continue;
      // Only the FIRST leg's departure must fall inside the user's stated
      // date window; later legs are free to land on subsequent calendar
      // days (overnight trains, multi-day break journeys) — bounded only
      // by the overall latestArrival ceiling above.
      if (path.length === 0) {
        if (edge.departure < earliestDeparture) continue;
        if (edge.departure > latestFirstLegDeparture) continue;
      }

      // avoid revisiting a station already in this path (no loops)
      if (path.some((e) => e.fromStationCode === edge.toStationCode)) continue;

      const runningFare = sumFare(path) + edge.fareEstimate;
      if (constraints.budgetMax !== undefined && runningFare > constraints.budgetMax) continue;

      const nextNotBefore = new Date(edge.arrival.getTime() + MIN_TRANSFER_MINUTES * 60_000);
      path.push(edge);
      dfs(edge.toStationCode, path, nextNotBefore);
      path.pop();

      if (results.length >= MAX_CANDIDATES) return;
    }
  }

  dfs(originCode, [], earliestDeparture);
  return results;
}

function sumFare(edges: TemporalEdge[]): number {
  return edges.reduce((sum, e) => sum + e.fareEstimate, 0);
}
