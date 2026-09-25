// packages/journey-engine/src/connection-validator.ts
// Classifies each transfer in a path as green/yellow/red, per PRD
// section "'continuous' needs a precise definition". This is a
// heuristic in V1 (buffer thresholds only) — station-complexity and
// historical-delay factors are noted as TODO for when that data exists.

import { PathCandidate } from './temporal-pathfinder';
import { ConnectionBuffer, SearchConstraints } from './types';

export function buildConnectionBuffers(
  candidate: PathCandidate,
  constraints: SearchConstraints
): ConnectionBuffer[] {
  const buffers: ConnectionBuffer[] = [];

  for (let i = 0; i < candidate.edges.length - 1; i++) {
    const arriving = candidate.edges[i];
    const departing = candidate.edges[i + 1];
    const minutes = Math.round(
      (departing.departure.getTime() - arriving.arrival.getTime()) / 60_000
    );

    let risk: ConnectionBuffer['risk'];
    let reason: string;

    if (minutes < constraints.minConnectionBufferMinutes) {
      risk = 'red';
      reason = `Only ${minutes}m to change trains at ${arriving.toStationCode} — likely too tight.`;
    } else if (minutes < constraints.tightConnectionBufferMinutes) {
      risk = 'yellow';
      reason = `${minutes}m connection at ${arriving.toStationCode} — workable but vulnerable to delays.`;
    } else {
      risk = 'green';
      reason = `${minutes}m connection at ${arriving.toStationCode} — comfortable buffer.`;
    }

    // TODO(V1.1): fold in per-station complexity (platform count / same
    // station code vs. a cross-town transfer like NDLS->ANVT) and
    // historical delay stats once availability_snapshots has real data.
    // Until then this is a buffer-only heuristic — don't present it as
    // more precise than that in the UI copy.

    buffers.push({ atStationCode: arriving.toStationCode, minutes, risk, reason });
  }

  return buffers;
}

export function hasBrokenConnection(buffers: ConnectionBuffer[]): boolean {
  return buffers.some((b) => b.risk === 'red');
}
