// packages/journey-engine/src/viability.ts
// Deterministic, honest booking-viability heuristic for V1 — explicitly
// NOT a machine-learned probability, per PRD non-goals (no ML until
// there's real historical outcome data). Returns 'unknown' whenever
// there's no availability_snapshots data to reason from, rather than
// fabricating a number. See docs/DB.md availability_snapshots table.

import { BookingViability } from './types';

export interface LegAvailabilitySignal {
  trainNumber: string;
  classCode: string;
  /** Null when no snapshot data exists for this train/class/date. */
  status: 'AVAILABLE' | 'RAC' | 'WL' | 'REGRET' | null;
  wlNumber?: number;
}

export function estimateViability(
  legSignals: LegAvailabilitySignal[],
  worstConnectionRisk: 'green' | 'yellow' | 'red'
): BookingViability {
  if (legSignals.some((s) => s.status === null)) {
    // Conservative: PRD explicitly forbids pretending we know when we
    // don't (Indian Railways' own framing — prediction is indicative,
    // never a guarantee — applies doubly to a heuristic with no data).
    return 'unknown';
  }

  const legScores = legSignals.map((s) => {
    if (s.status === 'AVAILABLE') return 1.0;
    if (s.status === 'RAC') return 0.6;
    if (s.status === 'WL') {
      // crude: assume higher WL number = lower chance, floor at 0.1
      const wl = s.wlNumber ?? 50;
      return Math.max(0.1, 1 - wl / 100);
    }
    return 0.05; // REGRET
  });

  // Weakest-leg heuristic, not naive independent multiplication — see
  // PRD "Complete journey probability" section on leg correlation.
  const weakestLeg = Math.min(...legScores);
  const connectionPenalty =
    worstConnectionRisk === 'red' ? 0.5 : worstConnectionRisk === 'yellow' ? 0.85 : 1.0;

  const score = weakestLeg * connectionPenalty;

  if (score >= 0.65) return 'high';
  if (score >= 0.35) return 'medium';
  return 'low';
}
