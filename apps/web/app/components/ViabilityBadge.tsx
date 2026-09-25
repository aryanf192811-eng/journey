import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { BookingViability } from '../lib/types';

// 3-tier tint model (bg-50 / border-200 / text-800) per the
// Stitch-generated design system in stitch-ui/project_info.json —
// never color alone, every badge pairs an icon and a text label.
const STYLES: Record<BookingViability, string> = {
  high: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  medium: 'bg-amber-50 border-amber-200 text-amber-800',
  low: 'bg-rose-50 border-rose-200 text-rose-800',
  unknown: 'bg-slate-100 border-slate-300 text-slate-700',
};

const ICONS: Record<BookingViability, typeof CheckCircle2> = {
  high: CheckCircle2,
  medium: AlertTriangle,
  low: XCircle,
  unknown: HelpCircle,
};

const LABELS: Record<BookingViability, string> = {
  high: 'Booking viability: High',
  medium: 'Booking viability: Medium',
  low: 'Booking viability: Low',
  unknown: 'Booking viability: Unknown',
};

export function ViabilityBadge({ viability }: { viability: BookingViability }) {
  const Icon = ICONS[viability];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${STYLES[viability]}`}
    >
      <Icon size={12} aria-hidden="true" />
      {LABELS[viability]}
    </span>
  );
}
