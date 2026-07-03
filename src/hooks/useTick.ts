import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

/** Drives the reference instant. ~15s is enough resolution for hh:mm clocks. */
export function useTick(intervalMs = 15_000): void {
  const tick = useStore((s) => s.tick);
  useEffect(() => {
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [tick, intervalMs]);
}
