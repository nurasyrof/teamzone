# Teamzone

**Know when your team is awake.** See your remote team's local time at a
glance — on an interactive globe and a draggable list. Client-only single-page
app: no login, no backend; data lives in `localStorage`.

**Live at [useteamzone.com](https://useteamzone.com)** — free, no sign-up.

Durable decisions live in [`CLAUDE.md`](./CLAUDE.md); the build plan in
[`PLAN.md`](./PLAN.md).

## Features

### Team list

- **Named team** — the list header is your team's name (default "My team"):
  click the pencil to rename it inline (Enter saves, Esc cancels).
- **People rows** — initials avatar, role, city, live local time, offset
  relative to the reference zone ("+2h", "−6h"), and day markers
  (Yesterday/Tomorrow) when their calendar day differs.
- **Drag to reorder** (`@dnd-kit`), edit and remove per row.
- **Filters** — a role dropdown, plus a **"Daytime only" toggle** that hides
  everyone outside working hours (06:00–18:00 local). Both combine and both
  react to the time scrubber.
- A fresh session starts with **"You"** in your own timezone, already pinned
  to the globe.

### Globe

- D3 orthographic projection (SVG) with grey landmasses and a faint graticule.
- **Home view centers on Indonesia with the equator level**; drag to spin
  (vertical tilt tolerated up to ±22.5°), reset-view button snaps back.
- People appear as **accent-colored markers with their initials**; hover or
  tap for name, role, and local time.
- **Live day/night terminator** (NOAA solar math) that moves with the
  scrubber.

### Time engine

- One reference instant drives every clock and the terminator — nothing can
  drift out of sync.
- **Fixed bottom scrubber** previews the whole team up to ±12h from now, with
  a LIVE indicator and reset-to-now button.
- **Searchable reference-timezone picker** in the navbar: type a city, zone
  ID, or UTC offset to filter, or scroll the full list. Relative labels and
  day markers re-anchor to whatever zone you pick.

### Adding people

- **By city** (primary): fuzzy search over ~240 curated cities with IANA
  zones and coordinates — exact, DST-proof, and globe-pinned.
- **By their current local time** (fallback): guesses a matching zone from
  hh:mm, clearly marked ≈ approximate (fixed offset, no globe pin).
- **CSV import/export** via the upload/download buttons — round-trips
  `name,role,timezoneId,city,lat,lng`; invalid rows are reported and skipped.

### UI & visuals

- **Design system**: minimalist greyscale with a single `#1C4746` teal
  accent; Plus Jakarta Sans headings + Inter body, self-hosted via
  Fontsource; design tokens as CSS variables (Tailwind v4 `@theme`).
- **Custom SVG icon set** (globe logo, theme, upload/download, toggles,
  pencil, drag handle, …) inlined with `currentColor` so icons follow text
  color and dark mode automatically.
- **Auto-dark theme** — follows daylight in the reference zone (scrub into
  night and watch it flip), with a manual light/dark override in the navbar.
- **Tooltips on every control**, shown on hover and keyboard focus.
- **Responsive**: globe + list side by side on desktop, stacked on tablet,
  Globe/List tab switch on mobile with a compact navbar.
- **SEO/share-ready**: Open Graph + Twitter card with a custom share image,
  favicon + touch icons, web manifest, robots.txt and sitemap.

All timezone math uses the platform `Intl` API with IANA zone IDs, so it is
DST-correct.

## Tech stack

- [Vite](https://vite.dev) + [React 19](https://react.dev) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
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

`npm run build` emits a fully static `dist/`. Production runs on Cloudflare
Pages (build command `npm run build`, output dir `dist`) and deploys
automatically on every push to `main`. Vercel/Netlify work the same way.

## Project structure

```
src/
  assets/icons/      SVG icon sources (inlined into components/icons.tsx)
  data/cities.json   curated cities (city, country, IANA zone, lat, lng)
  lib/               time (Intl helpers), solar (sub-solar point), csv, avatar
  store/useStore.ts  Zustand store + persist (team, people, reference instant,
                     filters, theme)
  hooks/             useTick (15s clock), useTheme (auto-dark)
  components/        Navbar, ZonePicker, Scrubber, Globe, PersonList/Row,
                     PersonForm, CityPicker, icons, ui/Modal, ui/Tooltip,
                     ui/Dropdown
  App.tsx            responsive shell (side-by-side / stacked / tabs)
public/              favicon, touch icons, og.png, manifest, robots, sitemap
```

---

2026 · Built by [Asyrof](https://nurasyrof.com)
