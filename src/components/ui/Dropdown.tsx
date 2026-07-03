import { useEffect, useRef, useState } from 'react';
import { IconCaretDown } from '../icons';
import { cn } from '@/lib/cn';

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
}

/** Small select replacement styled like the navbar's zone picker. */
export function Dropdown({ value, options, onChange, ariaLabel }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex items-center gap-1 rounded-lg border border-grey-300 bg-white px-2 py-1.5 text-xs text-grey-600 hover:border-accent dark:border-grey-700 dark:bg-grey-950 dark:text-grey-300 dark:hover:border-grey-400"
      >
        <span className="max-w-32 truncate">{selected?.label ?? value}</span>
        <IconCaretDown className="size-3 shrink-0 text-grey-400" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-30 mt-1 max-h-64 min-w-36 overflow-y-auto rounded-lg border border-grey-200 bg-white py-1 shadow-lg dark:border-grey-700 dark:bg-grey-900"
        >
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full px-3 py-1.5 text-left text-xs hover:bg-accent-soft dark:hover:bg-grey-800',
                  o.value === value && 'font-semibold',
                )}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
