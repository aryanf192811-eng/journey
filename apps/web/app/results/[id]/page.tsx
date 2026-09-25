import Link from 'next/link';
import { fetchSearchResults } from '../../lib/api';
import { JourneyCard } from '../../components/JourneyCard';
import { Journey } from '../../lib/types';

export default async function ResultsPage({ params }: { params: { id: string } }) {
  let journeys: Journey[] = [];
  let loadError: string | null = null;

  try {
    const data = await fetchSearchResults(params.id);
    journeys = data.journeys;
  } catch (e: any) {
    loadError = e.message ?? 'Could not load this search.';
  }

  return (
    <main className="min-h-screen px-4 py-10 max-w-2xl mx-auto">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">← New search</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">
        {journeys.length} viable journey{journeys.length !== 1 ? 's' : ''} found
      </h1>

      {loadError && <p className="text-red-600">{loadError}</p>}

      {!loadError && journeys.length === 0 && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center">
          <p className="text-neutral-700 mb-3">
            No journeys fit your constraints in this date window and budget.
          </p>
          <p className="text-sm text-neutral-500 mb-4">
            Try widening the date range, raising the budget, or allowing one more transfer.
          </p>
          <Link href="/" className="inline-block bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm">
            Adjust search
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {journeys.map((j, i) => (
          <JourneyCard key={i} journey={j} searchId={params.id} rank={i + 1} />
        ))}
      </div>
    </main>
  );
}
