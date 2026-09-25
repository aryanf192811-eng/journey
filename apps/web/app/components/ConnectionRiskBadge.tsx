import { ConnectionRisk } from '../lib/types';

const STYLES: Record<ConnectionRisk, string> = {
  green: 'bg-emerald-100 text-emerald-800',
  yellow: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
};

const LABELS: Record<ConnectionRisk, string> = {
  green: 'Connection risk: Low',
  yellow: 'Connection risk: Medium',
  red: 'Connection risk: High',
};

export function ConnectionRiskBadge({ risk }: { risk: ConnectionRisk }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STYLES[risk]}`}>
      {LABELS[risk]}
    </span>
  );
}
