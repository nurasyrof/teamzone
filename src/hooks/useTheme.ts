import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { isZoneDaylight } from '@/lib/solar';

/** Applies Tailwind's `dark` class. In auto mode it follows daylight in the
 *  reference zone, so scrubbing into night flips the theme too. */
export function useTheme(): void {
  const theme = useStore((s) => s.theme);
  const zone = useStore((s) => s.referenceZoneId);
  const instant = useStore((s) => s.referenceInstant);

  useEffect(() => {
    const dark = theme === 'dark' || (theme === 'auto' && !isZoneDaylight(zone, instant));
    document.documentElement.classList.toggle('dark', dark);
  }, [theme, zone, instant]);
}
