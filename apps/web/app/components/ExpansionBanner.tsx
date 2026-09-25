'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { ExpandedStation } from '../lib/types';

// See docs/UI.md: expansion results must be a dismissible banner, never
// silently mixed into the main journey list without this label.
export function ExpansionBanner({
  expandedOrigins,
  expandedDestinations,
}: {
  expandedOrigins?: ExpandedStation[];
  expandedDestinations?: ExpandedStation[];
}) {
  const [dismissed, setDismissed] = useState(false);
  const stations = [...(expandedOrigins ?? []), ...(expandedDestinations ?? [])];
  if (dismissed || stations.length === 0) return null;

  // These are suggestions to re-search from, not journeys already in the
  // list below — API.md's expandedOrigins/expandedDestinations is a
  // station+time list, not full Journey objects. Never imply more than
  // that (see PRD "never silently substituted").
  const list = stations
    .map((s) => `${s.stationCode} (~${s.extraTravelMinutes}m extra)`)
    .join(', ');

  return (
    <div className="flex items-start justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800">
      <p className="flex items-start gap-2">
        <Info size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
        <span>Few strong options from your exact stations. Also worth trying: {list}.</span>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-700 hover:text-amber-900 shrink-0 cursor-pointer"
        aria-label="Dismiss"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
