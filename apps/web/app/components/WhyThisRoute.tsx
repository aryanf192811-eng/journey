export function WhyThisRoute({ whyThisRoute, cautions }: { whyThisRoute: string[]; cautions: string[] }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
      <h3 className="font-semibold">Why this route</h3>
      <ul className="space-y-1.5">
        {whyThisRoute.map((item, i) => (
          <li key={i} className="text-sm flex gap-2">
            <span className="text-emerald-600">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {cautions.length > 0 && (
        <ul className="space-y-1.5 pt-2 border-t border-neutral-100">
          {cautions.map((item, i) => (
            <li key={i} className="text-sm flex gap-2 text-neutral-600">
              <span className="text-amber-600">⚠</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
