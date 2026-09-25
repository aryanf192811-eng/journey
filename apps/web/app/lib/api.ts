// apps/web/app/lib/api.ts

import { SearchResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface SearchParams {
  origin: string;
  destination: string;
  dateFrom: string;
  dateTo: string;
  budgetMax?: number;
  classes: string[];
  maxTransfers?: number;
  passengers?: number;
}

export async function searchJourneys(params: SearchParams): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/api/journeys/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Search failed (${res.status})`);
  }
  return res.json();
}

export async function fetchSearchResults(searchId: string): Promise<{ journeys: any[] }> {
  const res = await fetch(`${API_BASE}/api/journeys/search/${searchId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Search not found');
  return res.json();
}

export async function searchStations(q: string): Promise<{ code: string; name: string; city: string }[]> {
  if (q.trim().length < 2) return [];
  const res = await fetch(`${API_BASE}/api/stations/search?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const body = await res.json();
  return body.stations;
}
