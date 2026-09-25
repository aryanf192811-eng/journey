import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { ConnectionRisk } from '../lib/types';

const STYLES: Record<ConnectionRisk, string> = {
  green: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  yellow: 'bg-amber-50 border-amber-200 text-amber-800',
  red: 'bg-rose-50 border-rose-200 text-rose-800',
};

const ICONS: Record<ConnectionRisk, typeof CheckCircle2> = {
  green: CheckCircle2,
  yellow: AlertTriangle,
  red: XCircle,
};

const LABELS: Record<ConnectionRisk, string> = {
  green: 'Connection risk: Low',
  yellow: 'Connection risk: Medium',
  red: 'Connection risk: High',
};

export function ConnectionRiskBadge({ risk }: { risk: ConnectionRisk }) {
  const Icon = ICONS[risk];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${STYLES[risk]}`}
    >
      <Icon size={12} aria-hidden="true" />
      {LABELS[risk]}
    </span>
  );
}
