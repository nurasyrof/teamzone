import { useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import citiesData from '@/data/cities.json';
import type { CityEntry } from '@/types';
import { cn } from '@/lib/cn';

export const CITIES = citiesData as CityEntry[];

const fuse = new Fuse(CITIES, {
  keys: [
    { name: 'city', weight: 2 },
    { name: 'country', weight: 1 },
  ],
  threshold: 0.35,
});

export function cityLabel(c: CityEntry): string {
  return `${c.city}, ${c.country}`;
}

interface CityPickerProps {
  value: CityEntry | null;
  onSelect: (city: CityEntry) => void;
}

export function CityPicker({ value, onSelect }: CityPickerProps) {
  const [query, setQuery] = useState(value ? cityLabel(value) : '');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    setQuery(value ? cityLabel(value) : '');
  }, [value]);

  const results = useMemo(
    () => (query.trim() ? fuse.search(query).slice(0, 8).map((r) => r.item) : []),
    [query],
  );

  const select = (city: CityEntry) => {
    onSelect(city);
    setQuery(cityLabel(city));
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-label="Search for a city"
        placeholder="Search a city, e.g. Tokyo…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (!results.length) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, results.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            select(results[highlight]);
          }
        }}
        className="w-full rounded-lg border border-grey-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent dark:border-grey-700 dark:bg-grey-950"
      />
      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-grey-200 bg-white shadow-lg dark:border-grey-700 dark:bg-grey-900"
        >
          {results.map((c, i) => (
            <li key={`${c.city}-${c.country}`} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(c)}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  'flex w-full items-baseline justify-between px-3 py-2 text-left text-sm',
                  i === highlight && 'bg-accent-soft dark:bg-grey-800',
                )}
              >
                <span>
                  {c.city}
                  <span className="text-grey-500"> · {c.country}</span>
                </span>
                <span className="text-xs text-grey-400">{c.timezoneId}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
