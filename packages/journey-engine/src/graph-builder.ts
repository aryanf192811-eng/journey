// packages/journey-engine/src/graph-builder.ts
// Resolves weekly train schedules into dated temporal edges and builds
// an in-memory adjacency map for a given date range. No I/O here —
// callers (apps/api) fetch rows from Postgres and pass them in.

import { TemporalEdge } from './types';

export interface RawTrainStop {
  trainNumber: string;
  trainName: string;
  runsOnDays: number[]; // 0=Sun..6=Sat
  stationCode: string;
  stopSequence: number;
  arrivalTime: string | null;   // 'HH:MM:SS' or null for origin
  departureTime: string | null; // 'HH:MM:SS' or null for terminus
  dayOffset: number;
}

export interface RawFare {
  trainNumber: string;
  classCode: string;
  baseFare: number;
}

/**
 * Expand every (train, consecutive-stop-pair, calendar-date-in-range)
 * combination into a concrete TemporalEdge, respecting runsOnDays and
 * dayOffset (for trains whose journey spans midnight).
 */
export function buildTemporalGraph(
  stops: RawTrainStop[],
  fares: RawFare[],
  dateFrom: Date,
  dateTo: Date,
  classes: string[]
): Map<string, TemporalEdge[]> {
  const graph = new Map<string, TemporalEdge[]>();

  const byTrain = groupBy(stops, (s) => s.trainNumber);
  const fareLookup = new Map<string, number>();
  for (const f of fares) {
    if (classes.includes(f.classCode)) {
      fareLookup.set(`${f.trainNumber}:${f.classCode}`, f.baseFare);
    }
  }

  for (const [trainNumber, trainStops] of byTrain) {
    const sorted = [...trainStops].sort((a, b) => a.stopSequence - b.stopSequence);

    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i];
      const to = sorted[i + 1];
      if (!from.departureTime || !to.arrivalTime) continue;

      for (const date of eachDateInRange(dateFrom, dateTo)) {
        const dow = date.getDay();
        if (!from.runsOnDays.includes(dow)) continue;

        const departure = combineDateTime(date, from.dayOffset, from.departureTime);
        const arrival = combineDateTime(date, to.dayOffset, to.arrivalTime);
        if (arrival <= departure) continue; // guard against bad data

        for (const classCode of classes) {
          const fare = fareLookup.get(`${trainNumber}:${classCode}`);
          if (fare === undefined) continue;

          const edge: TemporalEdge = {
            trainNumber,
            trainName: from.trainName,
            fromStationCode: from.stationCode,
            toStationCode: to.stationCode,
            departure,
            arrival,
            classCode,
            fareEstimate: fare,
          };

          pushEdge(graph, from.stationCode, edge);
        }
      }
    }
  }

  return graph;
}

function pushEdge(graph: Map<string, TemporalEdge[]>, stationCode: string, edge: TemporalEdge) {
  const existing = graph.get(stationCode);
  if (existing) existing.push(edge);
  else graph.set(stationCode, [edge]);
}

function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return map;
}

function* eachDateInRange(from: Date, to: Date): Generator<Date> {
  const cur = new Date(from);
  while (cur <= to) {
    yield new Date(cur);
    cur.setDate(cur.getDate() + 1);
  }
}

function combineDateTime(baseDate: Date, dayOffset: number, time: string): Date {
  const [h, m, s] = time.split(':').map(Number);
  const d = new Date(baseDate);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, s ?? 0, 0);
  return d;
}
