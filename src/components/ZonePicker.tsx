import { useEffect, useMemo, useRef, useState } from 'react';
import { offsetLabel } from '@/lib/time';
import { IconCaretDown } from './icons';
import { Tooltip } from './ui/Tooltip';
import { cn } from '@/lib/cn';

export interface ZoneOption {
  zone: string;
  label: string;
  offset: number;
}

interface ZonePickerProps {
  value: string;
  options: ZoneOption[];
  onChange: (zone: string) => void;
}

/** Reference-timezone dropdown: a search field on top of the full scrollable
 *  zone list, so long lists are filterable without losing browsability. */
export function ZonePicker({ value, options, onChange }: ZonePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.zone === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.zone.toLowerCase().includes(q) ||
        offsetLabel(o.offset).toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setHighlight(Math.max(0, options.findIndex((o) => o.zone === value)));
    searchRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, options, value]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${highlight}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlight, filtered]);

  const select = (zone: string) => {
    onChange(zone);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <Tooltip label="Change reference timezone" side="bottom" disabled={open}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Reference timezone"
          className="flex max-w-36 items-center gap-1 rounded-lg border border-grey-300 bg-white px-2 py-1.5 text-xs text-grey-600 hover:border-accent sm:max-w-48 dark:border-grey-700 dark:bg-grey-950 dark:text-grey-300 dark:hover:border-grey-400"
        >
          <span className="truncate">
            {selected ? `${selected.label} (${offsetLabel(selected.offset)})` : value}
          </span>
          <IconCaretDown className="size-3 shrink-0 text-grey-400" />
        </button>
      </Tooltip>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-64 overflow-hidden rounded-lg border border-grey-200 bg-white shadow-lg dark:border-grey-700 dark:bg-grey-900">
          <div className="border-b border-grey-200 p-2 dark:border-grey-700">
            <input
              ref={searchRef}
              type="text"
              value={query}
              placeholder="Search zone or city…"
              aria-label="Search timezones"
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlight((h) => Math.min(h + 1, filtered.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlight((h) => Math.max(h - 1, 0));
                } else if (e.key === 'Enter' && filtered[highlight]) {
                  e.preventDefault();
                  select(filtered[highlight].zone);
                }
              }}
              className="w-full rounded-md border border-grey-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-accent dark:border-grey-700 dark:bg-grey-950"
            />
          </div>
          <ul ref={listRef} role="listbox" className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-grey-500">No matching zones</li>
            )}
            {filtered.map((o, i) => (
              <li key={o.zone} role="option" aria-selected={o.zone === value} data-index={i}>
                <button
                  type="button"
                  onClick={() => select(o.zone)}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    'flex w-full items-baseline justify-between gap-2 px-3 py-1.5 text-left text-xs',
                    i === highlight && 'bg-accent-soft dark:bg-grey-800',
                    o.zone === value && 'font-semibold',
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  <span className="shrink-0 text-grey-400">{offsetLabel(o.offset)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
