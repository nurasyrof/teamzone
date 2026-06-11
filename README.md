# TeamZone

Visualize a remote team's local time and availability across time zones — at a
glance, on a timeline, or on a world map.

This is **v2**: a React + TypeScript rewrite of the original single-file app
(preserved in [`legacy/index.html`](./legacy/index.html)).

## Features

- **Multiple named teams** — create, rename, switch, and delete teams. Each
  holds its own roster.
- **Sessions auto-save** to the browser (`localStorage`). Reload and your teams,
  reference timezone, and current view are right where you left them. Data from
  the original v1 app is migrated automatically on first load.
- **Now view** — per-member cards with local time, UTC offset, day-difference,
  and a Working / Awake / Asleep status, sorted by availability.
- **Calendar view**
  - _Daily overlap_ — each member's working and awake hours mapped onto a single
    reference-timezone timeline, with a live "now" marker.
  - _Weekly heatmap_ — how many teammates are working each hour of the week.
- **Map view** — an equirectangular world map with a live day/night terminator,
  the solar-noon point, and animated status pins.
- **Time scrubber** — preview the whole team's availability up to ±12h from now.
- **Reference timezone** — re-base every view to any zone.
- **Add member by current time** — type what time it is for someone and TeamZone
  finds a matching IANA zone.
- **Import / Export** the active team's roster as JSON.

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev) (dev server + build)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand) with the `persist` middleware

All timezone math uses the platform `Intl` API, so it is DST-correct.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the Vite dev server with HMR       |
| `npm run build`     | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview`   | Preview the production build locally     |
| `npm run typecheck` | Type-check only                          |

## Deploying

`npm run build` emits a static site to `dist/`. Drop it on any static host
(Netlify, Vercel, GitHub Pages, S3, …) — there is no backend.

> Note: the Map view loads its base world image from Wikimedia Commons, so that
> view needs an internet connection to show the map texture (pins and the
> day/night terminator still render offline).

## Project structure

```
src/
  lib/         time/timezone math, city coords, helpers, hooks
  store/       Zustand store (teams, members, settings, persistence)
  components/
    ui/        Button, Modal, Field, Toast primitives
    views/     NowView, CalendarView, MapView
    Header, Scrubber, TeamSwitcher, MemberDialog, EmptyState
  App.tsx, main.tsx
```
