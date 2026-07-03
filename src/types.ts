/** Store IANA timezone IDs, never fixed UTC offsets — see CLAUDE.md. */
export interface Person {
  id: string;
  name: string;
  role: string;
  /** IANA zone, e.g. "America/New_York". */
  timezoneId: string;
  /** Display label, e.g. "New York". Empty for the hh:mm fallback. */
  city: string;
  /** Globe placement. Null when the person was added via the hh:mm fallback. */
  lat: number | null;
  lng: number | null;
  accentSeed?: string;
  /** True when the zone was guessed from a typed local time (drifts at DST). */
  approximate?: boolean;
}

export type PersonDraft = Omit<Person, 'id'>;

export interface CityEntry {
  city: string;
  country: string;
  timezoneId: string;
  lat: number;
  lng: number;
}

export type Theme = 'auto' | 'light' | 'dark';
