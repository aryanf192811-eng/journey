import { Check, AlertTriangle } from 'lucide-react';

export function WhyThisRoute({ whyThisRoute, cautions }: { whyThisRoute: string[]; cautions: string[] }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
      <h3 className="font-semibold">Why this route</h3>
      <ul className="space-y-1.5">
        {whyThisRoute.map((item, i) => (
          <li key={i} className="text-sm flex gap-2">
            <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {cautions.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <h3 className="font-semibold text-sm text-slate-700 mb-1.5">Cautions</h3>
          <ul className="space-y-1.5">
            {cautions.map((item, i) => (
              <li key={i} className="text-sm flex gap-2 text-slate-600">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
