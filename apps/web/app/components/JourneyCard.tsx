import Link from 'next/link';
import { Journey } from '../lib/types';
import { ViabilityBadge } from './ViabilityBadge';
import { ConnectionRiskBadge } from './ConnectionRiskBadge';

function worstRisk(j: Journey): 'green' | 'yellow' | 'red' {
  const order = { green: 0, yellow: 1, red: 2 } as const;
  return j.connectionBuffers.reduce<'green' | 'yellow' | 'red'>(
    (w, b) => (order[b.risk] > order[w] ? b.risk : w),
    'green'
  );
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

export function JourneyCard({ journey, searchId, rank }: { journey: Journey; searchId: string; rank: number }) {
  const route = journey.legs.map((l) => l.fromStationCode).concat(journey.legs[journey.legs.length - 1].toStationCode);

  return (
    <Link
      href={`/results/${searchId}/${rank}`}
      className="block bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
        <span className="font-semibold text-lg break-words">{route.join(' → ')}</span>
        <span className="text-lg font-semibold shrink-0 tabular-nums">₹{journey.totalFareEstimate}</span>
      </div>
      <div className="text-sm text-slate-600 mb-3">
        {formatDuration(journey.totalDurationMinutes)} · {journey.transferCount} transfer{journey.transferCount !== 1 ? 's' : ''}
      </div>
      <div className="flex gap-2 flex-wrap">
        <ViabilityBadge viability={journey.bookingViability} />
        {journey.connectionBuffers.length > 0 && <ConnectionRiskBadge risk={worstRisk(journey)} />}
      </div>
    </Link>
  );
}
