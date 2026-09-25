import { BookingViability } from '../lib/types';

const STYLES: Record<BookingViability, string> = {
  high: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-red-100 text-red-800',
  unknown: 'bg-neutral-200 text-neutral-600',
};

const LABELS: Record<BookingViability, string> = {
  high: 'Booking viability: High',
  medium: 'Booking viability: Medium',
  low: 'Booking viability: Low',
  unknown: 'Booking viability: Unknown',
};

export function ViabilityBadge({ viability }: { viability: BookingViability }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STYLES[viability]}`}>
      {LABELS[viability]}
    </span>
  );
}
