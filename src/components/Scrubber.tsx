import { useStore } from '@/store/useStore';
import { IconScrubSlider } from './icons';
import { Tooltip } from './ui/Tooltip';
import { cn } from '@/lib/cn';

function offsetText(minutes: number): string {
  const sign = minutes < 0 ? '−' : '+';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}h${m ? ` ${m}m` : ''}`;
}

export function Scrubber() {
  const scrubMinutes = useStore((s) => s.scrubMinutes);
  const isLive = useStore((s) => s.isLive);
  const setScrubMinutes = useStore((s) => s.setScrubMinutes);
  const resetToNow = useStore((s) => s.resetToNow);

  return (
    <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
      <span
        className={cn(
          'flex w-20 shrink-0 items-center gap-1.5 text-xs font-semibold tabular-nums',
          isLive ? 'text-accent dark:text-grey-300' : 'text-grey-500',
        )}
      >
        <IconScrubSlider className="size-4 shrink-0" />
        {isLive ? 'LIVE' : offsetText(scrubMinutes)}
      </span>
      <Tooltip label="Drag to preview up to ±12h from now" className="flex-1">
        <input
          type="range"
          min={-720}
          max={720}
          step={15}
          value={scrubMinutes}
          onChange={(e) => setScrubMinutes(Number(e.target.value))}
          aria-label="Preview the team up to 12 hours before or after now"
          className="h-1.5 w-full"
        />
      </Tooltip>
      <Tooltip label="Snap back to live time">
        <button
          type="button"
          onClick={resetToNow}
          disabled={isLive}
          className="shrink-0 rounded-lg border border-grey-300 px-2.5 py-1 text-xs font-medium text-grey-600 transition hover:border-accent hover:text-accent disabled:opacity-40 dark:border-grey-700 dark:text-grey-300 dark:hover:border-grey-400 dark:hover:text-grey-100"
        >
          Now
        </button>
      </Tooltip>
    </div>
  );
}
