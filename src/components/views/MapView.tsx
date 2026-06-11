import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useEvalDate } from '@/lib/useClock';
import { coordsFor, fmtTime, STATUS_META, statusOf } from '@/lib/time';
import { truncate } from '@/lib/util';
import type { Member } from '@/types';

const W = 1000;
const H = 500;
const X = (lon: number) => ((lon + 180) / 360) * W;
const Y = (lat: number) => ((90 - lat) / 180) * H;

interface Pin {
  id: string;
  x: number;
  y: number;
  color: string;
  name: string;
  hhmm: string;
  label: string;
  lblWidth: number;
  flip: boolean;
}

function computeTerminator(d: Date) {
  const dayMs = d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor(dayMs / 86400000);
  let decl = 23.44 * Math.sin((2 * Math.PI * (dayOfYear - 81)) / 365);
  if (Math.abs(decl) < 0.6) decl = decl < 0 ? -0.6 : 0.6;

  const utcFrac =
    (d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds()) / 86400;
  let subLon = 180 - utcFrac * 360;
  while (subLon < -180) subLon += 360;
  while (subLon > 180) subLon -= 360;

  const rad = Math.PI / 180;
  const termLat = (lon: number) =>
    Math.atan(-Math.cos((lon - subLon) * rad) / Math.tan(decl * rad)) / rad;

  const pts: string[] = [];
  for (let lon = -180; lon <= 180; lon += 2) {
    pts.push(`${X(lon).toFixed(1)},${Y(termLat(lon)).toFixed(1)}`);
  }
  if (decl > 0) pts.push(`${W},${H}`, `0,${H}`);
  else pts.push(`${W},0`, `0,0`);

  return { path: 'M' + pts.join('L') + 'Z', sunX: X(subLon), sunY: Y(decl) };
}

function computePins(members: Member[], d: Date): Pin[] {
  const placed: Array<{ x: number; y: number }> = [];
  return members.map((m) => {
    const [lat, lon] = coordsFor(m, d);
    let x = X(lon);
    let y = Y(lat);
    let tries = 0;
    while (
      placed.some((p) => Math.abs(p.x - x) < 14 && Math.abs(p.y - y) < 14) &&
      tries < 8
    ) {
      y -= 15;
      tries++;
    }
    placed.push({ x, y });
    const st = statusOf(m, d);
    const f = fmtTime(m.tz, d);
    const lblWidth = Math.max(58, m.name.length * 6.4 + 18);
    return {
      id: m.id,
      x,
      y,
      color: STATUS_META[st].color,
      name: m.name,
      hhmm: f.hhmm,
      label: `${m.name} — ${f.hhmm} ${STATUS_META[st].label}`,
      lblWidth,
      flip: x > W - 130,
    };
  });
}

export function MapView() {
  const members = useStore((s) => s.activeTeam().members);
  const d = useEvalDate();

  const graticule = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    for (let lon = -150; lon <= 150; lon += 30)
      lines.push({ x1: X(lon), y1: 0, x2: X(lon), y2: H });
    for (let lat = -60; lat <= 60; lat += 30)
      lines.push({ x1: 0, y1: Y(lat), x2: W, y2: Y(lat) });
    return lines;
  }, []);

  const term = useMemo(() => computeTerminator(d), [d]);
  const pins = useMemo(() => computePins(members, d), [members, d]);

  return (
    <div className="relative rounded-card border border-line bg-panel p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-auto w-full rounded-[10px] bg-[#0b1426]"
      >
        <defs>
          <radialGradient id="oceanG" cx="50%" cy="35%" r="80%">
            <stop offset="0%" stopColor="#13243f" />
            <stop offset="100%" stopColor="#0b1426" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#oceanG)" />
        <image
          href="https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg"
          x={0}
          y={0}
          width={W}
          height={H}
          preserveAspectRatio="none"
          opacity={0.55}
        />
        <g>
          {graticule.map((l, i) => (
            <line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="rgba(120,140,200,.10)"
            />
          ))}
        </g>
        <path
          d={term.path}
          fill="rgba(8,12,30,0.55)"
          stroke="rgba(120,140,200,.25)"
          strokeWidth={1}
        />
        <circle cx={term.sunX} cy={term.sunY} r={7} fill="#ffd66b" stroke="#fff3c4" strokeWidth={2} />
        <g>
          {pins.map((p) => (
            <g key={p.id} transform={`translate(${p.x},${p.y})`}>
              <circle r={6.5} fill={p.color} stroke="#0b1426" strokeWidth={2}>
                <title>{p.label}</title>
              </circle>
              <circle r={6.5} fill={p.color} opacity={0.35}>
                <animate
                  attributeName="r"
                  values="6.5;13;6.5"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.35;0;0.35"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </circle>
              <g transform={`translate(${p.flip ? -p.lblWidth - 12 : 12},-9)`}>
                <rect
                  x={0}
                  y={0}
                  width={p.lblWidth}
                  height={18}
                  rx={5}
                  fill="rgba(8,12,22,.78)"
                  stroke={p.color}
                  strokeWidth={1}
                />
                <text x={6} y={13} fill="#fff" fontSize={11} fontWeight={600}>
                  {truncate(p.name, 12)} {p.hhmm}
                </text>
              </g>
            </g>
          ))}
        </g>
      </svg>

      <div className="mt-3 flex flex-wrap gap-[18px] px-1 text-xs text-muted">
        <span className="inline-flex items-center gap-[6px]">
          <span className="h-[10px] w-[10px] rounded-full bg-green" /> Working
        </span>
        <span className="inline-flex items-center gap-[6px]">
          <span className="h-[10px] w-[10px] rounded-full bg-amber" /> Awake
        </span>
        <span className="inline-flex items-center gap-[6px]">
          <span className="h-[10px] w-[10px] rounded-full bg-sleep" /> Asleep
        </span>
        <span className="ml-auto">
          🌙 shaded = night right now · ☀ = where it&apos;s solar noon
        </span>
      </div>
    </div>
  );
}
