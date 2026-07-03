/** All timezone math goes through Intl so it stays DST-correct. */

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(zone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = zone + JSON.stringify(options);
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-GB', { ...options, timeZone: zone });
    formatterCache.set(key, fmt);
  }
  return fmt;
}

export const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function isValidZone(zone: string): boolean {
  try {
    getFormatter(zone, { hour: '2-digit' });
    return true;
  } catch {
    return false;
  }
}

/** "14:05" in the given zone. */
export function formatTime(instantMs: number, zone: string): string {
  return getFormatter(zone, { hour: '2-digit', minute: '2-digit', hour12: false }).format(instantMs);
}

/** "Fri, 3 Jul" in the given zone. */
export function formatDay(instantMs: number, zone: string): string {
  const parts = getFormatter(zone, { weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(instantMs);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('weekday')}, ${get('day')} ${get('month')}`;
}

/** Calendar date "2026-07-02" in the given zone, for same-day comparisons. */
function isoDate(instantMs: number, zone: string): string {
  const parts = getFormatter(zone, { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instantMs);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** UTC offset of a zone at a given instant, in minutes. */
export function zoneOffsetMinutes(zone: string, instantMs: number): number {
  const parts = getFormatter(zone, { timeZoneName: 'longOffset' }).formatToParts(instantMs);
  const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(name);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

/** "UTC+5:30" style label. */
export function offsetLabel(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? '−' : '+';
  const abs = Math.abs(offsetMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

/** Offset of `zone` relative to `referenceZone`: "same time", "+9h", "−3:30". */
export function relativeLabel(zone: string, referenceZone: string, instantMs: number): string {
  const diff = zoneOffsetMinutes(zone, instantMs) - zoneOffsetMinutes(referenceZone, instantMs);
  if (diff === 0) return 'same time';
  const sign = diff < 0 ? '−' : '+';
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : 'h'}`;
}

/** "", "Tomorrow" or "Yesterday" — `zone`'s calendar day vs the reference zone's. */
export function dayDifferenceLabel(zone: string, referenceZone: string, instantMs: number): string {
  const there = isoDate(instantMs, zone);
  const here = isoDate(instantMs, referenceZone);
  if (there === here) return '';
  return there > here ? 'Tomorrow' : 'Yesterday';
}

const ETC_FALLBACK_ZONES = Array.from({ length: 27 }, (_, i) => {
  const h = i - 12; // UTC-12 … UTC+14; Etc/GMT signs are inverted
  return `Etc/GMT${h <= 0 ? '+' : '-'}${Math.abs(h)}`;
});

/**
 * Guess an IANA zone from "what time is it for them right now" (hh:mm).
 * Only a fixed offset can be derived, so the result drifts at DST changes —
 * callers must mark the person as approximate.
 */
export function zoneFromLocalTime(hhmm: string, nowMs: number): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;

  const now = new Date(nowMs);
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  let diff = Math.round((h * 60 + m - utcMinutes) / 15) * 15;
  while (diff < -720) diff += 1440;
  while (diff > 840) diff -= 1440;

  const zones = [...Intl.supportedValuesOf('timeZone'), ...ETC_FALLBACK_ZONES];
  return zones.find((z) => isValidZone(z) && zoneOffsetMinutes(z, nowMs) === diff) ?? null;
}
