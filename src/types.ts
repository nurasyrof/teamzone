/** A single teammate. Work hours are whole-hour local times [start, end). */
export interface Member {
  id: string;
  name: string;
  role: string;
  /** IANA timezone, e.g. "Asia/Tokyo". */
  tz: string;
  /** Local hour work begins, 0–24. */
  workStart: number;
  /** Local hour work ends, 0–24. */
  workEnd: number;
  /** Work days as JS weekday indices (0 = Sun … 6 = Sat). */
  days: number[];
  /** Avatar accent colour (hex). */
  color: string;
}

/** A named group of members. The app can hold several. */
export interface Team {
  id: string;
  name: string;
  members: Member[];
}

export type ViewId = 'now' | 'calendar' | 'map';
export type CalMode = 'daily' | 'weekly';

/** Three buckets a member falls into at a given instant. */
export type Status = 'work' | 'awake' | 'sleep';

/** Draft shape used by the add/edit member form. */
export type MemberDraft = Omit<Member, 'id' | 'color'> & {
  id?: string;
  color?: string;
};
