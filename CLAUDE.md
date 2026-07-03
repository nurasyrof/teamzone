# CLAUDE.md — Teamzone

Durable context for this project. Claude Code loads this automatically at the
start of every session. Keep it as the source of truth for decisions; put
step-by-step build work in `PLAN.md`.

## What we're building

**Teamzone** — a tool for remote freelancers/teams to see everyone's current
local time at a glance, via an interactive globe and a draggable list.

**Scope of this PoC:** client-only single-page app. No login, no shared
backend. Data lives in the browser (localStorage). A backend upgrade path
exists (see bottom) but is explicitly out of scope for now.

## Tech stack (decided — don't swap without reason)

- **Build/framework:** Vite + React + TypeScript. (No Next.js — no server needs.)
- **Styling:** Tailwind CSS, `class` dark-mode strategy.
- **State:** Zustand with `persist` middleware → localStorage.
- **Globe:** D3 orthographic projection (`d3-geo`, `d3-geo-projection`,
  `versor`, `topojson-client`). NOT three.js / react-globe.gl. Reason: matches
  the greyscale minimalist aesthetic exactly and stays lightweight.
- **Drag-and-drop:** `@dnd-kit/core` + `@dnd-kit/sortable`. (Not
  react-beautiful-dnd — unmaintained.)
- **CSV:** `papaparse` for import. Export is hand-rolled string + Blob download.
- **Fonts:** self-hosted via `@fontsource/plus-jakarta-sans` (headings) and
  `@fontsource/inter` (body).
- **Fuzzy search (optional):** `fuse.js` for the city dropdown typo tolerance.

## Design system (non-negotiable brief)

- **Style:** minimalist, light-themed, monochromatic/greyscale ONLY, plus a
  single accent color.
- **Accent:** `#1C4746` (deep teal). This is the only non-grey color.
- **Heading font:** Plus Jakarta Sans.
- **Body font:** Inter.
- Define these as design tokens (CSS variables + Tailwind theme extension) so
  they're referenced by name everywhere, never hardcoded per-component.

Suggested tokens:
```css
:root {
  --accent: #1C4746;
  /* greyscale ramp: --grey-50 … --grey-900 */
}
```

## Data model (get this right — everything reads from it)

**Store IANA timezone IDs, NEVER fixed UTC offsets.** "Asia/Tokyo" survives
daylight-saving changes; "+09:00" silently drifts wrong.

```ts
type Person = {
  id: string;
  name: string;
  role: string;
  timezoneId: string;   // IANA, e.g. "America/New_York"
  city: string;         // display label, e.g. "New York"
  lat: number;          // for globe placement
  lng: number;
  accentSeed?: string;  // for deterministic avatar color/initials
};
```

- **Per-person time display uses the browser, no library:**
  `new Intl.DateTimeFormat('en-GB', { timeZone: person.timezoneId,
  hour: '2-digit', minute: '2-digit', hour12: false }).format(referenceInstant)`
- **City dropdown** needs a curated `cities.json` of major world cities:
  `{ city, country, timezoneId, lat, lng }`. `Intl.supportedValuesOf('timeZone')`
  lists zones but has no coordinates, and the globe needs lat/lng — so ship the
  curated dataset.
- **Manual hh:mm fallback:** if a user types a raw time instead of picking a
  city, we can only derive a fixed offset (will drift at DST) and have no
  coordinates (no globe pin). Make city selection the primary path; treat hh:mm
  as an explicit "unknown zone / approximate / no globe pin" fallback with a
  visible warning. Don't let it be the default.

## Time engine (single source of truth)

- Keep ONE `referenceInstant: Date` in the store. Everything — every person's
  clock AND the globe's day/night terminator — reads from it.
- **"Now" mode:** a `setInterval` tick (every ~15s is enough for hh:mm) sets
  `referenceInstant = new Date()`.
- **24h scrubber:** adds an offset to that instant. Scrubbing must move every
  clock and the terminator together.
- **Reset-to-now:** snaps back to live mode.
- **Reference-timezone selector:** only changes which zone anchors the navbar's
  own clock and relative labels (e.g. "+9h from you"). It does NOT change
  `referenceInstant`.

## Day/night + auto-dark

- Compute the sub-solar point from `referenceInstant`; draw a `geoCircle` at its
  antipode (90° radius) and shade it for the night side of the globe.
- **Auto-dark nice-to-have:** reuse the same daylight boolean for the reference
  zone to toggle Tailwind's `dark` class. Basically free once the math exists.

## Responsive rules

- **Desktop:** globe + list side by side.
- **Tablet:** stacked.
- **Mobile:** tab switch (Globe / List), navbar collapses to a compact bar.
- Globe radius scales down on narrow viewports.

## Deployment

- Static bundle: `npm run build` → `dist/`.
- Deploy to Cloudflare Pages (preferred) or Vercel/Netlify. Git push to deploy,
  free tier, auto HTTPS + custom domain. No server, no DB.

## PoC defaults (unless told otherwise)

- **Avatars:** colored initials circles (deterministic from name). No image
  uploads yet.
- **Globe render target:** SVG (simpler event handling, fine up to ~50 people).
  Switch to canvas only if marker count grows.

## Upgrade path (OUT OF SCOPE now — for later)

When shared team data / login is needed: add Supabase (Postgres + auth +
realtime), swap the Zustand-persist layer for Supabase queries. Data model
above is already clean enough that the client barely changes.
