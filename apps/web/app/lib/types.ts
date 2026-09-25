// apps/web/app/lib/types.ts
// Mirrors apps/api response shapes (see docs/API.md). Kept in sync
// manually in V1 — a shared package is a V1.1 nicety per docs/UI.md.

export interface JourneyLeg {
  trainNumber: string;
  trainName: string;
  fromStationCode: string;
  toStationCode: string;
  departure: string;
  arrival: string;
  durationMinutes: number;
  classCode: string;
  fareEstimate: number;
}

export type ConnectionRisk = 'green' | 'yellow' | 'red';

export interface ConnectionBuffer {
  atStationCode: string;
  minutes: number;
  risk: ConnectionRisk;
  reason: string;
}

export type BookingViability = 'high' | 'medium' | 'low' | 'unknown';

export interface Journey {
  legs: JourneyLeg[];
  totalFareEstimate: number;
  totalDurationMinutes: number;
  transferCount: number;
  connectionBuffers: ConnectionBuffer[];
  departureTime: string;
  arrivalTime: string;
  journeyQualityScore: number;
  bookingViability: BookingViability;
  whyThisRoute: string[];
  cautions: string[];
}

export interface SearchResponse {
  searchId: number;
  query: { originCode: string; destinationCode: string; dateFrom: string; dateTo: string };
  journeys: Journey[];
  expandedOrigins?: { stationCode: string; extraTravelMinutes: number }[];
  expandedDestinations?: { stationCode: string; extraTravelMinutes: number }[];
}
