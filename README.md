# Teamzone

See your remote team's local time at a glance — on an interactive globe and a
draggable list. Client-only single-page app: no login, no backend; data lives
in `localStorage`.

Durable decisions live in [`CLAUDE.md`](./CLAUDE.md); the build plan in
[`PLAN.md`](./PLAN.md).

## Features

- **People list** — initials avatars, role, city, live local time, offset
  relative to the reference zone, day markers (Yesterday/Tomorrow).
  Drag-to-reorder (`@dnd-kit`), role filter, edit/remove. A fresh session
  starts with **"You"** in your own timezone, pinned to the globe.
- **Globe** — D3 orthographic projection (SVG), centered on the equator by
  default. Drag to spin (vertical tilt clamped to ±22.5°), reset-view button,
  person markers with initials and local-time tooltips, live day/night
  terminator.
- **Time engine** — one reference instant drives every clock and the
  terminator. A fixed bottom scrubber previews ±12h; reset-to-now snaps back
  live. The reference-timezone picker is searchable (city, zone ID, or UTC
  offset) while keeping the full browsable list.
- **Add people by city** (fuzzy search over ~240 curated cities with IANA
  zones + coordinates) or by their current local time (explicit "approximate"
  fallback: fixed offset, no globe pin).
- **Auto-dark** — theme follows daylight in the reference zone (scrub into
  night and watch it flip), with a manual light/dark override.
- **CSV import/export** — round-trips `name,role,timezoneId,city,lat,lng`;
  invalid rows are reported and skipped.
- **Tooltips everywhere** — every control explains itself on hover or
  keyboard focus.

All timezone math uses the platform `Intl` API with IANA zone IDs, so it is
DST-correct.

## Tech stack

- [Vite](https://vite.dev) + [React 19](https://react.dev) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) — greyscale design tokens with a
  single `#1C4746` accent; Plus Jakarta Sans (headings) + Inter (body),
  self-hosted via Fontsource
- [Zustand](https://github.com/pmndrs/zustand) with `persist` → localStorage
- [d3-geo](https://d3js.org/d3-geo) + world-atlas topojson for the globe
- [@dnd-kit](https://dndkit.com) for drag-to-reorder,
  [PapaParse](https://www.papaparse.com) for CSV import,
  [Fuse.js](https://fusejs.io) for fuzzy city search

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command             | Description                                |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Vite dev server with HMR                   |
| `npm run build`     | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview`   | Preview the production build               |
| `npm run typecheck` | Type-check only                            |

## Deploying

`npm run build` emits a fully static `dist/` — drop it on Cloudflare Pages
(preferred), Vercel, or Netlify. Build command `npm run build`, output dir
`dist`. No server, no DB.

## Project structure

```
src/
  assets/icons/      SVG icon sources (inlined into components/icons.tsx)
  data/cities.json   curated cities (city, country, IANA zone, lat, lng)
  lib/               time (Intl helpers), solar (sub-solar point), csv, avatar
  store/useStore.ts  Zustand store + persist (people, reference instant, prefs)
  hooks/             useTick (15s clock), useTheme (auto-dark)
  components/        Navbar, ZonePicker, Scrubber, Globe, PersonList/Row,
                     PersonForm, CityPicker, icons, ui/Modal, ui/Tooltip
  App.tsx            responsive shell (side-by-side / stacked / tabs)
```
