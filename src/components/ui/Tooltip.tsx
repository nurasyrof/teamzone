import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface TooltipProps {
  label: string;
  side?: 'top' | 'bottom';
  /** Suppress the bubble (e.g. while an attached dropdown is open). */
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/** CSS-only tooltip: shows on hover and keyboard focus of the wrapped control. */
export function Tooltip({ label, side = 'top', disabled, className, children }: TooltipProps) {
  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {children}
      {!disabled && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-md bg-grey-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-sm transition-opacity delay-150 group-focus-within/tip:opacity-100 group-hover/tip:opacity-100 dark:bg-grey-100 dark:text-grey-900',
            side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
