'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StationAutocomplete } from './StationAutocomplete';
import { searchJourneys } from '../lib/api';

const CLASS_OPTIONS = ['SL', '3A', '2A', '1A', 'CC'];

// Per-viewer convenience only — remembers what you typed across a refresh
// or an accidental back-navigation. Never used as a source of truth for
// anything the server needs; wrapped in try/catch since private browsing
// or disabled storage can throw.
const STORAGE_KEY = 'journey-search-form';

export function SearchForm() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [classes, setClasses] = useState<string[]>(['SL', '3A']);
  const [maxTransfers, setMaxTransfers] = useState(1);
  const [passengers, setPassengers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage after mount (not in a lazy useState
  // initializer — that would run during SSR too, where localStorage
  // doesn't exist, and cause a hydration mismatch).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.origin === 'string') setOrigin(saved.origin);
      if (typeof saved.destination === 'string') setDestination(saved.destination);
      if (typeof saved.dateFrom === 'string') setDateFrom(saved.dateFrom);
      if (typeof saved.dateTo === 'string') setDateTo(saved.dateTo);
      if (typeof saved.budgetMax === 'string') setBudgetMax(saved.budgetMax);
      if (Array.isArray(saved.classes)) setClasses(saved.classes);
      if (typeof saved.maxTransfers === 'number') setMaxTransfers(saved.maxTransfers);
      if (typeof saved.passengers === 'number') setPassengers(saved.passengers);
    } catch {
      // private browsing, disabled storage, corrupted value — just skip
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ origin, destination, dateFrom, dateTo, budgetMax, classes, maxTransfers, passengers })
      );
    } catch {
      // best-effort — a full/blocked storage shouldn't break the form
    }
  }, [origin, destination, dateFrom, dateTo, budgetMax, classes, maxTransfers, passengers]);

  function toggleClass(c: string) {
    setClasses((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!origin || !destination || !dateFrom || !dateTo || classes.length === 0) {
      setError('Please fill in origin, destination, dates, and at least one class.');
      return;
    }
    setLoading(true);
    try {
      const result = await searchJourneys({
        origin,
        destination,
        dateFrom,
        dateTo,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        classes,
        maxTransfers,
        passengers,
      });
      router.push(`/results/${result.searchId}`);
    } catch (err: any) {
      setError(err.message ?? 'Search failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StationAutocomplete label="From" value={origin} onChange={setOrigin} />
        <StationAutocomplete label="To" value={destination} onChange={setDestination} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Earliest date</label>
          <input type="date" className="w-full rounded border border-slate-300 px-3 py-2" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Latest date</label>
          <input type="date" className="w-full rounded border border-slate-300 px-3 py-2" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Budget max (₹, optional)</label>
        <input type="number" className="w-full rounded border border-slate-300 px-3 py-2" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="e.g. 2500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Class</label>
        <div className="flex gap-2 flex-wrap">
          {CLASS_OPTIONS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => toggleClass(c)}
              className={`px-3 py-1.5 rounded text-sm border cursor-pointer ${
                classes.includes(c) ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 text-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Max transfers</label>
          <div className="flex gap-2">
            {[0, 1, 2].map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => setMaxTransfers(n)}
                className={`flex-1 rounded border py-2 text-sm cursor-pointer ${
                  maxTransfers === n ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Passengers</label>
          <input type="number" min={1} className="w-full rounded border border-slate-300 px-3 py-2" value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white rounded py-2.5 font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? 'Searching…' : 'Find viable journeys'}
      </button>

      {loading && (
        <p className="text-sm text-slate-500 text-center" role="status">
          Searching across your date range for viable journeys…
        </p>
      )}
    </form>
  );
}
