import { useEffect, useMemo, useRef, useState } from 'react';
import { geoCircle, geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import world from 'world-atlas/land-110m.json';
import { useStore } from '@/store/useStore';
import { subsolarPoint } from '@/lib/solar';
import { formatTime } from '@/lib/time';
import { initials } from '@/lib/avatar';
import { IconReset } from './icons';
import { Tooltip } from './ui/Tooltip';
import type { Person } from '@/types';

const topology = world as unknown as Parameters<typeof feature>[0];
const land = feature(topology, topology.objects.land);
const graticule = geoGraticule10();

/** Home view: equator in the middle, centered on Indonesia. */
const HOME_LAMBDA = -118;
const HOME_PHI = 0;
/** Vertical drag is tolerated but clamped to ±25% of the 90° range. */
const MAX_PHI = 22.5;

interface DragState {
  x0: number;
  y0: number;
  lambda0: number;
  phi0: number;
}

interface ActiveMarker {
  person: Person;
  x: number;
  y: number;
}

export function Globe() {
  const people = useStore((s) => s.people);
  const referenceInstant = useStore((s) => s.referenceInstant);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const [size, setSize] = useState(480);
  const [lambda, setLambda] = useState(HOME_LAMBDA);
  const [phi, setPhi] = useState(HOME_PHI);
  const [active, setActive] = useState<ActiveMarker | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setSize(Math.max(280, Math.min(el.clientWidth, 640)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const radius = size / 2 - 12;

  const projection = useMemo(
    () =>
      geoOrthographic()
        .rotate([lambda, phi, 0])
        .translate([size / 2, size / 2])
        .scale(radius)
        .clipAngle(90),
    [lambda, phi, size, radius],
  );
  const path = useMemo(() => geoPath(projection), [projection]);

  const nightPath = useMemo(() => {
    const [slng, slat] = subsolarPoint(referenceInstant);
    return geoCircle().center([slng + 180, -slat]).radius(90)();
  }, [referenceInstant]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x0: e.clientX, y0: e.clientY, lambda0: lambda, phi0: phi };
    e.currentTarget.setPointerCapture(e.pointerId);
    setActive(null);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const k = 75 / radius;
    const nextLambda = drag.lambda0 + (e.clientX - drag.x0) * k;
    const nextPhi = drag.phi0 - (e.clientY - drag.y0) * k;
    setLambda(((nextLambda + 540) % 360) - 180);
    setPhi(Math.max(-MAX_PHI, Math.min(MAX_PHI, nextPhi)));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const viewCenter: [number, number] = [-lambda, -phi];

  return (
    <div ref={containerRef} className="relative flex w-full justify-center">
      <div className="relative max-w-full" style={{ width: size, height: size }}>
        <svg
          ref={svgRef}
          width={size}
          height={size}
          className="cursor-grab touch-none select-none active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <path
            d={path({ type: 'Sphere' }) ?? undefined}
            className="fill-white stroke-grey-300 dark:fill-grey-900 dark:stroke-grey-700"
          />
          <path
            d={path(graticule) ?? undefined}
            strokeWidth={0.5}
            className="fill-none stroke-grey-200 dark:stroke-grey-800"
          />
          <path d={path(land) ?? undefined} className="fill-grey-300 dark:fill-grey-700" />
          <path
            d={path(nightPath) ?? undefined}
            className="pointer-events-none fill-grey-900/15 dark:fill-black/40"
          />
          {people.map((person) => {
            if (person.lat === null || person.lng === null) return null;
            const lngLat: [number, number] = [person.lng, person.lat];
            if (geoDistance(lngLat, viewCenter) > Math.PI / 2 - 0.02) return null;
            const pos = projection(lngLat);
            if (!pos) return null;
            return (
              <g
                key={person.id}
                transform={`translate(${pos[0]},${pos[1]})`}
                className="cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerEnter={() => setActive({ person, x: pos[0], y: pos[1] })}
                onPointerLeave={() =>
                  setActive((a) => (a?.person.id === person.id ? null : a))
                }
                onClick={() => setActive({ person, x: pos[0], y: pos[1] })}
              >
                <circle
                  r={10}
                  strokeWidth={1.5}
                  className="fill-accent stroke-white dark:stroke-grey-900"
                />
                <text
                  textAnchor="middle"
                  dy="0.35em"
                  className="pointer-events-none select-none fill-white text-[8px] font-semibold"
                >
                  {initials(person.name)}
                </text>
              </g>
            );
          })}
        </svg>
        {active && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-grey-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-grey-700 dark:bg-grey-900"
            style={{ left: active.x, top: active.y + 14 }}
          >
            <div className="font-heading text-sm font-bold">{active.person.name}</div>
            {active.person.role && <div className="text-grey-500">{active.person.role}</div>}
            <div className="mt-1 font-medium tabular-nums">
              {formatTime(referenceInstant, active.person.timezoneId)}
              {active.person.city && <span className="text-grey-500"> · {active.person.city}</span>}
            </div>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0">
        <Tooltip label="Reset globe view">
          <button
          type="button"
          onClick={() => {
            setLambda(HOME_LAMBDA);
            setPhi(HOME_PHI);
          }}
          aria-label="Reset globe rotation"
          className="flex size-8 items-center justify-center rounded-lg border border-grey-300 bg-white text-grey-500 hover:border-accent hover:text-accent dark:border-grey-700 dark:bg-grey-900 dark:text-grey-400 dark:hover:border-grey-400 dark:hover:text-grey-100"
        >
            <IconReset className="size-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
