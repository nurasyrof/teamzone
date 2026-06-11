import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useEvalDate } from '@/lib/useClock';
import {
  fmtHour,
  fmtOffset,
  fmtTime,
  shortTz,
  STATUS_META,
  statusOf,
  tzOffsetMin,
} from '@/lib/time';
import { initials } from '@/lib/util';
import { IconButton } from '@/components/ui/Button';

const BADGE_BG: Record<string, string> = {
  work: 'bg-green/[0.13] text-green',
  awake: 'bg-amber/[0.13] text-amber',
  sleep: 'bg-sleep/[0.18] text-[#9fb0d0]',
};

export function NowView({ onEdit }: { onEdit: (id: string) => void }) {
  const members = useStore((s) => s.activeTeam().members);
  const refTz = useStore((s) => s.settings.refTz);
  const d = useEvalDate();

  const sorted = useMemo(() => {
    return [...members].sort((a, b) => {
      const ra = STATUS_META[statusOf(a, d)].rank;
      const rb = STATUS_META[statusOf(b, d)].rank;
      if (ra !== rb) return ra - rb;
      return tzOffsetMin(b.tz, d) - tzOffsetMin(a.tz, d);
    });
  }, [members, d]);

  const refDay = fmtTime(refTz, d).parts.d;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[14px]">
      {sorted.map((m) => {
        const st = statusOf(m, d);
        const sm = STATUS_META[st];
        const f = fmtTime(m.tz, d);
        const diffDay = f.parts.d !== refDay;
        return (
          <div
            key={m.id}
            onClick={() => onEdit(m.id)}
            className="group relative cursor-pointer overflow-hidden rounded-card border border-line bg-[linear-gradient(180deg,var(--color-panel)_0%,var(--color-panel2)_140%)] p-4 transition-[0.15s] hover:-translate-y-[2px] hover:border-[#3a4456] hover:shadow-float"
          >
            <div
              className="absolute bottom-0 left-0 top-0 w-[5px]"
              style={{ background: sm.color }}
            />
            <div className="absolute right-3 top-3 flex gap-[6px] opacity-0 transition-[0.15s] group-hover:opacity-100">
              <IconButton
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(m.id);
                }}
              >
                ✎
              </IconButton>
            </div>

            <div className="flex items-center gap-3">
              <div
                className="grid h-11 w-11 flex-none place-items-center rounded-xl text-base font-bold text-ink"
                style={{ background: m.color }}
              >
                {initials(m.name)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-bold">{m.name}</div>
                <div className="truncate text-[12.5px] text-muted">{m.role}</div>
              </div>
            </div>

            <div className="mb-1 mt-[14px] flex items-baseline gap-[9px]">
              <span className="tnum text-[30px] font-bold tracking-[0.5px]">
                {f.h12}
              </span>
              <span className="font-semibold text-muted">{f.ampm}</span>
              {diffDay && (
                <span className="rounded-[20px] bg-line px-[7px] py-px text-[11px] font-bold text-amber">
                  {f.parts.weekday}
                </span>
              )}
            </div>

            <div className="flex justify-between gap-2 text-[12.5px] text-muted">
              <span>{shortTz(m.tz)}</span>
              <span>{fmtOffset(tzOffsetMin(m.tz, d))}</span>
            </div>

            <div
              className={`mt-3 inline-flex items-center gap-[6px] rounded-[20px] px-[10px] py-1 text-xs font-bold ${BADGE_BG[st]}`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: sm.color }}
              />
              {sm.label}
              {st === 'work' && ` · until ${fmtHour(m.workEnd)}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}
