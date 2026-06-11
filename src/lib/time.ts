import type { Member, Status } from '@/types';
import { CITY } from '@/lib/cities';
import { DAYS, hashStr } from '@/lib/util';

/* ============================ Zone discovery ============================ */
export function guessLocalTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** All IANA zones the runtime knows, falling back to our city table. */
export function supportedTimeZones(): string[] {
  try {
    const zones = Intl.supportedValuesOf('timeZone');
    if (zones.length) return zones;
  } catch {
    /* older runtimes */
  }
  return Object.keys(CITY);
}

/** Last path segment of a zone, humanised: "Asia/Kuala_Lumpur" → "Kuala Lumpur". */
export function shortTz(tz: string): string {
  return (tz.split('/').pop() || tz).replace(/_/g, ' ');
}

/* ============================ Offset & parts ============================ */
/** Offset (minutes) of a timezone from UTC at a given instant. DST-correct.
 *  Cached at hour granularity since offsets only change at DST boundaries. */
const offCache = new Map<string, number>();
export function tzOffsetMin(tz: string, date: Date): number {
  const key = tz + '|' + Math.floor(date.getTime() / 3600000);
  const cached = offCache.get(key);
  if (cached !== undefined) return cached;
  let val: number;
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const p: Record<string, string> = {};
    for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
    const hh = p.hour === '24' ? 0 : +p.hour;
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, hh, +p.minute, +p.second);
    val = Math.round((asUTC - date.getTime()) / 60000);
  } catch {
    val = 0;
  }
  offCache.set(key, val);
  return val;
}

export interface TzParts {
  weekday: string;
  /** Weekday index 0–6 (Sun–Sat), or -1 if unknown. */
  wd: number;
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  /** e.g. "Mon 6/11". */
  dateStr: string;
}

/** Wall-clock parts of an instant rendered in a timezone. */
export function tzParts(tz: string, date: Date): TzParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
  const hh = p.hour === '24' ? 0 : +p.hour;
  return {
    weekday: p.weekday,
    wd: DAYS.indexOf(p.weekday as (typeof DAYS)[number]),
    y: +p.year,
    mo: +p.month,
    d: +p.day,
    h: hh,
    mi: +p.minute,
    dateStr: `${p.weekday} ${p.month}/${p.day}`,
  };
}

export interface FmtTime {
  /** 24h "HH:MM". */
  hhmm: string;
  /** 12h "H:MM" (no am/pm). */
  h12: string;
  ampm: 'AM' | 'PM';
  parts: TzParts;
}

export function fmtTime(tz: string, date: Date): FmtTime {
  const p = tzParts(tz, date);
  const ampm = p.h < 12 ? 'AM' : 'PM';
  let h12 = p.h % 12;
  if (h12 === 0) h12 = 12;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    hhmm: `${pad(p.h)}:${pad(p.mi)}`,
    h12: `${h12}:${pad(p.mi)}`,
    ampm,
    parts: p,
  };
}

export function fmtOffset(min: number): string {
  const s = min < 0 ? '−' : '+';
  const a = Math.abs(min);
  return `UTC${s}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(
    a % 60,
  ).padStart(2, '0')}`;
}

export function fmtHour(h: number): string {
  const ap = h < 12 ? 'am' : 'pm';
  let x = h % 12;
  if (x === 0) x = 12;
  return x + ap;
}

/* ============================ Status ============================ */
export function statusOf(m: Member, date: Date): Status {
  const p = tzParts(m.tz, date);
  const hour = p.h + p.mi / 60;
  const onDay = m.days.includes(p.wd);
  if (onDay && hour >= m.workStart && hour < m.workEnd) return 'work';
  if (hour >= 7 && hour < 23) return 'awake';
  return 'sleep';
}

export interface StatusMeta {
  label: string;
  /** CSS colour expression. */
  color: string;
  rank: number;
}

export const STATUS_META: Record<Status, StatusMeta> = {
  work: { label: 'Working', color: 'var(--color-green)', rank: 0 },
  awake: { label: 'Awake / off-hours', color: 'var(--color-amber)', rank: 1 },
  sleep: { label: 'Asleep', color: 'var(--color-sleep)', rank: 2 },
};

/* ============================ Calendar helpers ============================ */
/** Map a [start, end) window in member-local hours into reference hours,
 *  splitting across midnight. Returns 0–24 fractional bands. */
export function bandsToRef(
  start: number,
  end: number,
  deltaHours: number,
): Array<[number, number]> {
  let s = start + deltaHours;
  let e = end + deltaHours;
  while (s < 0) {
    s += 24;
    e += 24;
  }
  while (s >= 24) {
    s -= 24;
    e -= 24;
  }
  const out: Array<[number, number]> = [];
  if (e <= 24) out.push([s, e]);
  else {
    out.push([s, 24]);
    out.push([0, e - 24]);
  }
  return out.filter((b) => b[1] > b[0]);
}

/* ============================ Map helpers ============================ */
export function coordsFor(m: Member, date: Date): [number, number] {
  if (CITY[m.tz]) return CITY[m.tz];
  const lon = (tzOffsetMin(m.tz, date) / 60) * 15;
  const lat = (Math.abs(hashStr(m.tz)) % 60) - 30;
  return [lat, Math.max(-179, Math.min(179, lon))];
}

/* ============================ Find zone by wall time ============================ */
/** Given a wall-clock time string, find the IANA zone whose current offset
 *  best matches it. Prefers a zone with known map coords on exact ties. */
export function findZoneFromTime(raw: string): string | null {
  const mt = raw.trim().match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)?$/i);
  if (!mt) return null;
  let h = +mt[1];
  const mi = mt[2] ? +mt[2] : 0;
  if (mt[3]) {
    const pm = /pm/i.test(mt[3]);
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
  }
  if (h > 23 || mi > 59) return null;

  const now = new Date();
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  let target = h * 60 + mi - utcMin;
  while (target <= -720) target += 1440;
  while (target > 840) target -= 1440;

  let best: string | null = null;
  let bestDiff = Infinity;
  for (const z of supportedTimeZones()) {
    const off = tzOffsetMin(z, now);
    let diff = Math.abs(off - target);
    diff = Math.min(diff, 1440 - diff);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = z;
    }
    if (diff === 0 && CITY[z]) {
      best = z;
      break;
    }
  }
  return best;
}

/** True when the runtime accepts the zone string. */
export function isValidTz(tz: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
