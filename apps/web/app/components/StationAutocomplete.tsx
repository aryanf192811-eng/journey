'use client';

import { useState, useEffect, useRef } from 'react';
import { searchStations } from '../lib/api';

export function StationAutocomplete({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [results, setResults] = useState<{ code: string; name: string; city: string }[]>([]);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const r = await searchStations(value);
      setResults(r);
    }, 200);
    return () => clearTimeout(timeoutRef.current);
  }, [value]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-neutral-600 mb-1">{label}</label>
      <input
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Station or city"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg max-h-56 overflow-auto">
          {results.map((s) => (
            <li
              key={s.code}
              className="px-3 py-2 hover:bg-neutral-100 cursor-pointer text-sm"
              onMouseDown={() => {
                onChange(s.code);
                setOpen(false);
              }}
            >
              <span className="font-medium">{s.name}</span>{' '}
              <span className="text-neutral-500">({s.code}) — {s.city}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
