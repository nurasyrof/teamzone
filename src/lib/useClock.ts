import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';

/** A ticking timestamp (ms) that updates on an interval. */
export function useClock(intervalMs = 15000): number {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return nowMs;
}

/** The instant to render: real now plus the scrubber offset.
 *  Re-renders on each tick and whenever the scrubber moves. */
export function useEvalDate(intervalMs = 15000): Date {
  const offset = useStore((s) => s.scrubOffsetMin);
  const nowMs = useClock(intervalMs);
  return useMemo(() => new Date(nowMs + offset * 60000), [nowMs, offset]);
}
