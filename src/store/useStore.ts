import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CalMode, Member, MemberDraft, Team, ViewId } from '@/types';
import { colorFor, uid } from '@/lib/util';
import { guessLocalTz } from '@/lib/time';

const STORE_KEY = 'teamzone.v2';
/** Legacy keys from the single-file v1 app, migrated on first load. */
const V1_MEMBERS = 'teamzone.members.v1';
const V1_VIEW = 'teamzone.view.v1';
const V1_REFTZ = 'teamzone.reftz';

interface Settings {
  refTz: string;
  view: ViewId;
  calMode: CalMode;
}

interface PersistedState {
  teams: Team[];
  activeTeamId: string;
  settings: Settings;
}

interface StoreState extends PersistedState {
  /** Minutes offset from real "now" controlled by the scrubber (not persisted). */
  scrubOffsetMin: number;

  // ---- selectors ----
  activeTeam: () => Team;
  members: () => Member[];

  // ---- team actions ----
  addTeam: (name: string) => void;
  renameTeam: (id: string, name: string) => void;
  deleteTeam: (id: string) => void;
  setActiveTeam: (id: string) => void;

  // ---- member actions ----
  addMember: (draft: MemberDraft) => void;
  updateMember: (id: string, draft: MemberDraft) => void;
  deleteMember: (id: string) => void;
  replaceMembers: (members: Member[]) => void;

  // ---- settings ----
  setRefTz: (tz: string) => void;
  setView: (view: ViewId) => void;
  setCalMode: (mode: CalMode) => void;

  // ---- scrubber ----
  setScrub: (min: number) => void;
  resetScrub: () => void;
}

function mkMember(
  name: string,
  role: string,
  tz: string,
  workStart: number,
  workEnd: number,
): Member {
  return {
    id: uid(),
    name,
    role,
    tz,
    workStart,
    workEnd,
    days: [1, 2, 3, 4, 5],
    color: colorFor(name),
  };
}

function seedTeam(): Team {
  return {
    id: uid('t'),
    name: 'My Team',
    members: [
      mkMember('You', 'Team Lead', guessLocalTz(), 9, 17),
      mkMember('Priya Sharma', 'Backend Engineer', 'Asia/Kolkata', 10, 18),
      mkMember('Diego Morales', 'Designer', 'America/Mexico_City', 9, 17),
      mkMember('Lena Fischer', 'PM', 'Europe/Berlin', 9, 17),
      mkMember('Kenji Tanaka', 'Mobile Dev', 'Asia/Tokyo', 9, 18),
    ],
  };
}

/** Normalise an imported/legacy member object to the current shape. */
function normalizeMember(m: Partial<Member>): Member {
  return {
    id: m.id || uid(),
    name: m.name || 'Unnamed',
    role: m.role || '',
    tz: m.tz || 'UTC',
    workStart: m.workStart ?? 9,
    workEnd: m.workEnd ?? 17,
    days: Array.isArray(m.days) ? m.days : [1, 2, 3, 4, 5],
    color: m.color || colorFor(m.name || 'x'),
  };
}

/** Build the starting persisted state, migrating from the v1 app if present. */
function initialPersisted(): PersistedState {
  let team: Team | null = null;
  try {
    const rawMembers = JSON.parse(localStorage.getItem(V1_MEMBERS) || 'null');
    if (Array.isArray(rawMembers) && rawMembers.length) {
      team = {
        id: uid('t'),
        name: 'My Team',
        members: rawMembers.map(normalizeMember),
      };
    }
  } catch {
    /* ignore malformed legacy data */
  }
  if (!team) team = seedTeam();

  const v1View = (localStorage.getItem(V1_VIEW) as ViewId) || 'now';
  const v1Ref = localStorage.getItem(V1_REFTZ) || guessLocalTz();

  return {
    teams: [team],
    activeTeamId: team.id,
    settings: {
      refTz: v1Ref,
      view: ['now', 'calendar', 'map'].includes(v1View) ? v1View : 'now',
      calMode: 'daily',
    },
  };
}

/** Immutably update the members of the active team. */
function mapActiveMembers(
  state: StoreState,
  fn: (members: Member[]) => Member[],
): Pick<StoreState, 'teams'> {
  return {
    teams: state.teams.map((t) =>
      t.id === state.activeTeamId ? { ...t, members: fn(t.members) } : t,
    ),
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialPersisted(),
      scrubOffsetMin: 0,

      activeTeam: () => {
        const { teams, activeTeamId } = get();
        return teams.find((t) => t.id === activeTeamId) || teams[0];
      },
      members: () => get().activeTeam()?.members ?? [],

      addTeam: (name) =>
        set((s) => {
          const team: Team = { id: uid('t'), name: name.trim() || 'New Team', members: [] };
          return { teams: [...s.teams, team], activeTeamId: team.id };
        }),
      renameTeam: (id, name) =>
        set((s) => ({
          teams: s.teams.map((t) =>
            t.id === id ? { ...t, name: name.trim() || t.name } : t,
          ),
        })),
      deleteTeam: (id) =>
        set((s) => {
          if (s.teams.length <= 1) return s; // always keep at least one team
          const teams = s.teams.filter((t) => t.id !== id);
          const activeTeamId =
            s.activeTeamId === id ? teams[0].id : s.activeTeamId;
          return { teams, activeTeamId };
        }),
      setActiveTeam: (id) => set({ activeTeamId: id }),

      addMember: (draft) =>
        set((s) =>
          mapActiveMembers(s, (ms) => [
            ...ms,
            {
              ...draft,
              id: uid(),
              color: draft.color || colorFor(draft.name),
            },
          ]),
        ),
      updateMember: (id, draft) =>
        set((s) =>
          mapActiveMembers(s, (ms) =>
            ms.map((m) =>
              m.id === id
                ? { ...m, ...draft, id: m.id, color: draft.color || m.color }
                : m,
            ),
          ),
        ),
      deleteMember: (id) =>
        set((s) => mapActiveMembers(s, (ms) => ms.filter((m) => m.id !== id))),
      replaceMembers: (members) =>
        set((s) => mapActiveMembers(s, () => members.map(normalizeMember))),

      setRefTz: (tz) => set((s) => ({ settings: { ...s.settings, refTz: tz } })),
      setView: (view) => set((s) => ({ settings: { ...s.settings, view } })),
      setCalMode: (calMode) =>
        set((s) => ({ settings: { ...s.settings, calMode } })),

      setScrub: (min) => set({ scrubOffsetMin: min }),
      resetScrub: () => set({ scrubOffsetMin: 0 }),
    }),
    {
      name: STORE_KEY,
      version: 2,
      // Persist only durable data; the scrubber is always live on reload.
      partialize: (s): PersistedState => ({
        teams: s.teams,
        activeTeamId: s.activeTeamId,
        settings: s.settings,
      }),
    },
  ),
);
