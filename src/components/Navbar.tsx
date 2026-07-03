import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { CITIES } from './CityPicker';
import { ZonePicker } from './ZonePicker';
import { browserZone, formatDay, formatTime, zoneOffsetMinutes } from '@/lib/time';
import { IconLogo, IconPlus, IconThemeAuto, IconThemeDark, IconThemeLight } from './icons';
import { Tooltip } from './ui/Tooltip';
import type { Theme } from '@/types';

const THEME_ICON: Record<Theme, typeof IconThemeAuto> = {
  auto: IconThemeAuto,
  light: IconThemeLight,
  dark: IconThemeDark,
};
const THEME_NEXT: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' };

export function Navbar({ onAdd }: { onAdd: () => void }) {
  const referenceInstant = useStore((s) => s.referenceInstant);
  const referenceZoneId = useStore((s) => s.referenceZoneId);
  const setReferenceZone = useStore((s) => s.setReferenceZone);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const ThemeIcon = THEME_ICON[theme];

  const zoneOptions = useMemo(() => {
    const byZone = new Map<string, string>();
    byZone.set(browserZone, `Your zone (${browserZone.split('/').pop()?.replace(/_/g, ' ')})`);
    byZone.set('UTC', 'UTC');
    for (const c of CITIES) {
      if (!byZone.has(c.timezoneId)) byZone.set(c.timezoneId, c.city);
    }
    if (!byZone.has(referenceZoneId)) byZone.set(referenceZoneId, referenceZoneId);
    return [...byZone.entries()]
      .map(([zone, label]) => ({ zone, label, offset: zoneOffsetMinutes(zone, referenceInstant) }))
      .sort((a, b) => a.offset - b.offset || a.label.localeCompare(b.label));
  }, [referenceZoneId, referenceInstant]);

  return (
    <header className="sticky top-0 z-20 border-b border-grey-200 bg-white/90 backdrop-blur dark:border-grey-800 dark:bg-grey-950/90">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <IconLogo className="size-6 text-accent dark:text-grey-300" />
          <span className="font-heading text-lg font-extrabold tracking-tight">Teamzone</span>
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <div className="font-heading text-sm font-bold tabular-nums">
            {formatTime(referenceInstant, referenceZoneId)} ·{' '}
            {formatDay(referenceInstant, referenceZoneId)}
          </div>

          <ZonePicker value={referenceZoneId} options={zoneOptions} onChange={setReferenceZone} />

          <Tooltip label={`Theme: ${theme} — switch to ${THEME_NEXT[theme]}`} side="bottom">
            <button
              type="button"
              onClick={() => setTheme(THEME_NEXT[theme])}
              aria-label={`Theme: ${theme}. Switch to ${THEME_NEXT[theme]}`}
              className="flex items-center rounded-lg border border-grey-300 px-2.5 py-2 text-grey-600 hover:border-accent hover:text-accent dark:border-grey-700 dark:text-grey-300 dark:hover:border-grey-400 dark:hover:text-grey-100"
            >
              <ThemeIcon className="size-4" />
            </button>
          </Tooltip>

          <Tooltip label="Add a teammate" side="bottom">
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90 dark:bg-grey-200 dark:text-grey-900"
            >
              <IconPlus className="size-3.5" />
              Add<span className="hidden sm:inline"> person</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
