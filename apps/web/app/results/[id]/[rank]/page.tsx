import Link from 'next/link';
import { fetchSearchResults } from '../../../lib/api';
import { WhyThisRoute } from '../../../components/WhyThisRoute';
import { ConnectionRiskBadge } from '../../../components/ConnectionRiskBadge';
import { ViabilityBadge } from '../../../components/ViabilityBadge';

export default async function JourneyDetailPage({ params }: { params: { id: string; rank: string } }) {
  const data = await fetchSearchResults(params.id);
  const journey = data.journeys[Number(params.rank) - 1];

  if (!journey) {
    return (
      <main className="min-h-screen px-4 py-10 max-w-2xl mx-auto">
        <p>Journey not found.</p>
        <Link href={`/results/${params.id}`} className="text-sm text-neutral-500 hover:underline">← Back to results</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 max-w-2xl mx-auto space-y-6">
      <Link href={`/results/${params.id}`} className="text-sm text-neutral-500 hover:underline">← Back to results</Link>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <div className="flex justify-between items-start gap-2 flex-wrap mb-4">
          <h1 className="text-2xl font-bold break-words">
            {journey.legs[0].fromStationCode} → {journey.legs[journey.legs.length - 1].toStationCode}
          </h1>
          <span className="text-2xl font-bold shrink-0">₹{journey.totalFareEstimate}</span>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          <ViabilityBadge viability={journey.bookingViability} />
        </div>

        <div className="space-y-4">
          {journey.legs.map((leg: any, i: number) => (
            <div key={i}>
              <div className="border-l-2 border-neutral-300 pl-4 py-1">
                <p className="font-medium">
                  {leg.trainName} ({leg.trainNumber}) — {leg.classCode}
                </p>
                <p className="text-sm text-neutral-600">
                  {leg.fromStationCode} {new Date(leg.departure).toLocaleString()} → {leg.toStationCode}{' '}
                  {new Date(leg.arrival).toLocaleString()}
                </p>
                <p className="text-sm text-neutral-500">₹{leg.fareEstimate}</p>
              </div>
              {journey.connectionBuffers[i] && (
                <div className="pl-4 py-2 flex items-center gap-2">
                  <ConnectionRiskBadge risk={journey.connectionBuffers[i].risk} />
                  <span className="text-sm text-neutral-600">{journey.connectionBuffers[i].reason}</span>
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
