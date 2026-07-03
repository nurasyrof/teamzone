import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import citiesData from '@/data/cities.json';
import type { CityEntry, Person, PersonDraft, Theme } from '@/types';
import { browserZone } from '@/lib/time';

interface TeamzoneState {
  people: Person[];
  /** The single reference instant (ms). Every clock and the terminator read this. */
  referenceInstant: number;
  isLive: boolean;
  /** Scrubber offset applied to "now", −720…720 minutes. 0 = live. */
  scrubMinutes: number;
  /** Anchors the navbar clock and relative labels only — never the instant. */
  referenceZoneId: string;
  roleFilter: string;
  theme: Theme;

  addPerson: (draft: PersonDraft) => void;
  editPerson: (id: string, patch: Partial<PersonDraft>) => void;
  removePerson: (id: string) => void;
  movePerson: (fromId: string, toId: string) => void;
  importPeople: (drafts: PersonDraft[]) => void;
  tick: () => void;
  setScrubMinutes: (minutes: number) => void;
  resetToNow: () => void;
  setReferenceZone: (zoneId: string) => void;
  setRoleFilter: (role: string) => void;
  setTheme: (theme: Theme) => void;
}

const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

/** Fresh sessions start with the user themself, not an empty list. Persisted
 *  sessions rehydrate over this, so it never resurrects after deletion. */
function defaultPeople(): Person[] {
  const home = (citiesData as CityEntry[]).find((c) => c.timezoneId === browserZone);
  return [
    {
      id: uid(),
      name: 'You',
      role: '',
      timezoneId: browserZone,
      city: home?.city ?? '',
      lat: home?.lat ?? null,
      lng: home?.lng ?? null,
    },
  ];
}

export const useStore = create<TeamzoneState>()(
  persist(
    (set, get) => ({
      people: defaultPeople(),
      referenceInstant: Date.now(),
      isLive: true,
      scrubMinutes: 0,
      referenceZoneId: browserZone,
      roleFilter: '',
      theme: 'auto',

      addPerson: (draft) => set({ people: [...get().people, { ...draft, id: uid() }] }),

      editPerson: (id, patch) =>
        set({ people: get().people.map((p) => (p.id === id ? { ...p, ...patch } : p)) }),

      removePerson: (id) => set({ people: get().people.filter((p) => p.id !== id) }),

      movePerson: (fromId, toId) => {
        const people = [...get().people];
        const from = people.findIndex((p) => p.id === fromId);
        const to = people.findIndex((p) => p.id === toId);
        if (from < 0 || to < 0 || from === to) return;
        const [moved] = people.splice(from, 1);
        people.splice(to, 0, moved);
        set({ people });
      },

      importPeople: (drafts) =>
        set({ people: [...get().people, ...drafts.map((d) => ({ ...d, id: uid() }))] }),

      tick: () => set({ referenceInstant: Date.now() + get().scrubMinutes * 60_000 }),

      setScrubMinutes: (minutes) =>
        set({
          scrubMinutes: minutes,
          isLive: minutes === 0,
          referenceInstant: Date.now() + minutes * 60_000,
        }),

      resetToNow: () => set({ scrubMinutes: 0, isLive: true, referenceInstant: Date.now() }),

      setReferenceZone: (zoneId) => set({ referenceZoneId: zoneId }),
      setRoleFilter: (role) => set({ roleFilter: role }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'teamzone',
      partialize: (s) => ({
        people: s.people,
        referenceZoneId: s.referenceZoneId,
        roleFilter: s.roleFilter,
        theme: s.theme,
      }),
    },
  ),
);
