import Link from 'next/link';
import { Info } from 'lucide-react';
import { fetchSearchResults } from '../../../lib/api';
import { WhyThisRoute } from '../../../components/WhyThisRoute';
import { ConnectionRiskBadge } from '../../../components/ConnectionRiskBadge';
import { ViabilityBadge } from '../../../components/ViabilityBadge';
import { Journey } from '../../../lib/types';

// General-quota IRCTC ARP is currently 60 days (changed from 120 in Nov
// 2024) — informational only, real ARP has exceptions this doesn't model
// (short-distance trains, FTQ), so copy always hedges as "general quota".
function bookingWindowLabel(bookingOpensDate: string): string {
  const opens = new Date(bookingOpensDate);
  const dateStr = opens.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return opens.getTime() <= Date.now()
    ? `Booking window already open (opened ${dateStr}, general quota)`
    : `Booking opens ${dateStr} (general quota, ~60 days before departure)`;
}

function ExpansionNote({ journey }: { journey: Journey }) {
  if (!journey.isOriginExpansion && !journey.isDestinationExpansion) return null;
  const parts: string[] = [];
  if (journey.isOriginExpansion) parts.push(`~${journey.originExtraTravelMinutes}m extra to reach origin`);
  if (journey.isDestinationExpansion) parts.push(`~${journey.destExtraTravelMinutes}m extra from destination`);
  return (
    <div className="flex items-center gap-1.5 text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded px-2 py-1 mb-4 w-fit">
      <Info size={12} aria-hidden="true" />
      <span>Alternate station — {parts.join(', ')}</span>
    </div>
  );
}

export default async function JourneyDetailPage({ params }: { params: { id: string; rank: string } }) {
  const data = await fetchSearchResults(params.id);
  const journey = data.journeys[Number(params.rank) - 1];

  if (!journey) {
    return (
      <main className="min-h-screen px-4 py-10 max-w-2xl mx-auto">
        <p>Journey not found.</p>
        <Link href={`/results/${params.id}`} className="text-sm text-slate-500 hover:underline">← Back to results</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 max-w-2xl mx-auto space-y-6">
      <Link href={`/results/${params.id}`} className="text-sm text-slate-500 hover:underline">← Back to results</Link>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <ExpansionNote journey={journey} />
        <div className="flex justify-between items-start gap-2 flex-wrap mb-4">
          <h1 className="text-2xl font-bold break-words">
            {journey.legs[0].fromStationCode} → {journey.legs[journey.legs.length - 1].toStationCode}
          </h1>
          <span className="text-2xl font-bold shrink-0 tabular-nums">₹{journey.totalFareEstimate}</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          <ViabilityBadge viability={journey.bookingViability} />
        </div>

        <div className="space-y-4">
          {journey.legs.map((leg: any, i: number) => (
            <div key={i}>
              <div className="border-l-2 border-slate-300 pl-4 py-1">
                <p className="font-medium">
                  {leg.trainName} ({leg.trainNumber}) — {leg.classCode}
                </p>
                <p className="text-sm text-slate-600 tabular-nums">
                  {leg.fromStationCode} {new Date(leg.departure).toLocaleString()} → {leg.toStationCode}{' '}
                  {new Date(leg.arrival).toLocaleString()}
                </p>
                <p className="text-sm text-slate-500 tabular-nums">₹{leg.fareEstimate}</p>
                <p className="text-xs text-slate-400 mt-0.5">{bookingWindowLabel(leg.bookingOpensDate)}</p>
              </div>
              {journey.connectionBuffers[i] && (
                <div className="pl-4 py-2 flex items-center gap-2">
                  <ConnectionRiskBadge risk={journey.connectionBuffers[i].risk} />
                  <span className="text-sm text-slate-600">{journey.connectionBuffers[i].reason}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <WhyThisRoute whyThisRoute={journey.whyThisRoute} cautions={journey.cautions} />
    </main>
  );
}
