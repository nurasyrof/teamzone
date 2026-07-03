# PLAN.md — Teamzone build phases

Work through these in order. Phases 2 and 4 define the data and time contracts
everything else reads from — get them solid before moving on. Durable decisions
(stack, design tokens, data model, time engine) live in `CLAUDE.md`; read that
first.

Check off items as they land.

---

## Phase 1 — Scaffold

- [x] `npm create vite@latest` → React + TypeScript template.
- [x] Install Tailwind; configure `content` paths and `class` dark-mode strategy.
- [x] Add design tokens: CSS variables for `--accent: #1C4746` and a greyscale
      ramp; extend the Tailwind theme to reference them.
- [x] Install and wire fonts: `@fontsource/plus-jakarta-sans` (headings),
      `@fontsource/inter` (body). Set base font families in the Tailwind theme.
- [x] Install Zustand; create the store skeleton with the shape:
      `people`, `referenceInstant`, `isLive`, `referenceZoneId`, `roleFilter`,
      `theme`.
- [x] Build an empty responsive layout shell: navbar + main area that will hold
      globe and list. No functionality yet — just structure and tokens applied.
- [x] Confirm dev server runs and the accent color + fonts are visibly correct.

## Phase 2 — Data core (do this well)

- [x] Define the `Person` type (see CLAUDE.md) and store actions:
      `addPerson`, `editPerson`, `removePerson`.
- [x] Turn on Zustand `persist` → localStorage. Verify data survives reload.
- [x] Create `data/cities.json`: a curated list of major world cities
      `{ city, country, timezoneId, lat, lng }` (aim for a few hundred).
- [x] Build the searchable city dropdown over that dataset (fuse.js optional
      for typo tolerance).
- [x] Build the add/edit person form (modal): name, role, city (searchable,
      primary path) OR hh:mm fallback with a visible "approximate / no globe
      pin" warning.
- [x] `lib/time.ts`: helper that formats an instant in a given IANA zone via
      `Intl.DateTimeFormat`. Test it renders correctly across several zones
      (e.g. Tokyo, New York, London, Los Angeles) — including across a DST
      boundary if possible.

## Phase 3 — List view

- [x] Render person rows: avatar (initials circle, deterministic color), name,
      role, city, live local time.
- [x] Role filter control (reads `roleFilter` from store).
- [x] Drag-to-reorder with `@dnd-kit/sortable`; persist the new order.
- [x] Edit and remove actions per row (open form / confirm delete).

## Phase 4 — Navbar time engine (do this well)

- [x] `hooks/useTick`: interval (~15s) that sets `referenceInstant = new Date()`
      while `isLive` is true.
- [x] Navbar shows local city, date, and current time.
- [x] 24h scrubber slider: sets an offset on `referenceInstant`; entering
      `isLive = false`. Every person clock must move with it.
- [x] Reset-to-now button: snaps back to `isLive = true`.
- [x] Reference-timezone selector: changes only the navbar's anchor zone and
      relative labels, not `referenceInstant`.

## Phase 5 — Globe

- [x] Add D3 deps (`d3-geo`, `d3-geo-projection`, `versor`, `topojson-client`)
      and a world topojson.
- [x] Render orthographic projection: grey landmasses + faint graticule, styled
      to the greyscale brief.
- [x] Drag-to-rotate (versor drag pattern).
- [x] Project each person's lat/lng to a marker (accent color); tooltip/click
      shows name, role, local time.
- [x] Scale globe radius responsively.

## Phase 6 — Day/night + auto-dark

- [x] `lib/solar.ts`: sub-solar point from `referenceInstant`; draw shaded
      night circle (`geoCircle`, antipode, 90° radius) on the globe.
- [x] Confirm the terminator moves when the scrubber moves.
- [x] Auto-dark nice-to-have: derive daylight boolean for the reference zone,
      toggle Tailwind `dark` class from it. Add a manual theme override too.

## Phase 7 — CSV import/export

- [x] Export: build a CSV string from `people`, download via Blob. Columns
      should round-trip cleanly (name, role, timezoneId, city, lat, lng).
- [x] Import: PapaParse the file, validate rows (valid IANA zone? coords
      present?), report bad rows, merge good ones into the store.

## Phase 8 — Responsive polish + deploy

- [x] Desktop side-by-side / tablet stacked / mobile Globe|List tab switch.
- [x] Compact mobile navbar.
- [x] Accessibility pass on drag, form, and controls.
- [ ] `npm run build`; deploy `dist/` to Cloudflare Pages (or Vercel/Netlify).
      Set build command `npm run build`, output dir `dist`. Verify live URL.

---

### Suggested first prompt to Claude Code

> Read CLAUDE.md and PLAN.md. Let's do Phase 1: scaffold the Vite + React + TS
> project with Tailwind, the design tokens (accent #1C4746 + greyscale), the two
> fonts self-hosted, the Zustand store skeleton, and the responsive layout
> shell. Stop after Phase 1 so I can review before we continue.
