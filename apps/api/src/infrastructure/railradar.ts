// apps/api/src/infrastructure/railradar.ts
// Thin client for RailRadar's read-only train API (api.railradar.in) — a
// vetted third-party REST API we consume as a normal client, not a scraper
// we write or maintain (see CLAUDE.md 2026-09-25 decision). Free tier is
// 1,000 requests/month, so results are cached in-memory for CACHE_TTL_MS.
// Any missing key, timeout, or error degrades to status: null ("unknown")
// — never fabricate availability (see journey-engine/src/viability.ts).

const BASE_URL = 'https://api.railradar.in/v1';
const CACHE_TTL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;

export type RawAvailabilityStatus = 'AVAILABLE' | 'RAC' | 'WL' | 'REGRET' | null;

export interface AvailabilityResult {
  status: RawAvailabilityStatus;
  wlNumber?: number;
}

interface RailRadarSeatsResponse {
  success: boolean;
  data?: {
    avlDayList: { availablityDate: string; availablityStatus: string }[];
  };
}

// ponytail: plain in-process Map, not Redis — per ARCHITECTURE.md, Redis
// is optional in V1 and this must degrade gracefully without it. Add a
// shared cache if this ever runs across multiple API instances.
const cache = new Map<string, { expiresAt: number; value: AvailabilityResult }>();

export async function fetchSeatAvailability(params: {
  trainNumber: string;
  classCode: string;
  fromStationCode: string;
  toStationCode: string;
  departureDate: Date;
}): Promise<AvailabilityResult> {
  const apiKey = process.env.RAILRADAR_API_KEY;
  if (!apiKey) return { status: null };

  const journeyDate = params.departureDate.toISOString().slice(0, 10);
  const cacheKey = `${params.trainNumber}:${params.classCode}:${params.fromStationCode}:${params.toStationCode}:${journeyDate}`;

  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const url = new URL(`${BASE_URL}/trains/${params.trainNumber}/seats`);
    url.searchParams.set('source', params.fromStationCode);
    url.searchParams.set('destination', params.toStationCode);
    url.searchParams.set('journeyDate', journeyDate);
    url.searchParams.set('classCode', params.classCode);

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return { status: null };

    const body = (await res.json()) as RailRadarSeatsResponse;
    const day = body.data?.avlDayList.find((d) => d.availablityDate === journeyDate);
    const result: AvailabilityResult = day
      ? parseAvailabilityStatus(day.availablityStatus)
      : { status: null };

    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value: result });
    return result;
  } catch {
    return { status: null }; // network error, timeout, bad JSON — stay honest, never throw into search
  }
}

/** RailRadar's status string mirrors IRCTC's own free-text convention,
 * e.g. "AVAILABLE-0042", "RAC 12", "GNWL24/WL11", "REGRET". */
export function parseAvailabilityStatus(raw: string): AvailabilityResult {
  const upper = raw.toUpperCase();
  if (upper.startsWith('AVAILABLE')) return { status: 'AVAILABLE' };
  if (upper.startsWith('RAC')) return { status: 'RAC' };
  const wlMatches = upper.match(/WL(\d+)/g);
  if (wlMatches && wlMatches.length > 0) {
    const last = wlMatches[wlMatches.length - 1];
    return { status: 'WL', wlNumber: Number(last.replace('WL', '')) };
  }
  if (upper.includes('REGRET') || upper.includes('NOT AVAILABLE')) return { status: 'REGRET' };
  return { status: null };
}
