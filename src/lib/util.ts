/** Avatar colour palette and weekday labels (Sun-first, matching JS getDay). */
export const PALETTE = [
  '#4f9dff',
  '#6c7cff',
  '#34d399',
  '#fbbf24',
  '#f87171',
  '#f472b6',
  '#22d3ee',
  '#a78bfa',
  '#fb923c',
  '#4ade80',
] as const;

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Deterministic 32-bit string hash (same algorithm as the v1 app). */
export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/** Short, collision-resistant id. */
export function uid(prefix = 'm'): string {
  return (
    prefix +
    Math.abs(hashStr(Math.random() + '' + performance.now())).toString(36)
  );
}

/** Stable colour for a name, so the same person keeps the same avatar tint. */
export function colorFor(name: string): string {
  return PALETTE[Math.abs(hashStr(name)) % PALETTE.length];
}

/** Up to two uppercase initials from a name. */
export function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?';
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
