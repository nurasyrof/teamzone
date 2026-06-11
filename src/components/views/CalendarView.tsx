import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useEvalDate } from '@/lib/useClock';
import {
  bandsToRef,
  fmtTime,
  shortTz,
  STATUS_META,
  statusOf,
  tzOffsetMin,
  tzParts,
} from '@/lib/time';
import { DAYS } from '@/lib/util';

export function CalendarView() {
  const calMode = useStore((s) => s.settings.calMode);
  const setCalMode = useStore((s) => s.setCalMode);

  return (
    <div>
      <div className="mb-[18px] inline-flex gap-[6px]">
        {(['daily', 'weekly'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setCalMode(mode)}
            className={`rounded-[9px] border px-[13px] py-[6px] text-[12.5px] font-semibold ${
              calMode === mode
                ? 'border-accent bg-panel2 text-text'
                : 'border-line bg-panel text-muted'
            }`}
          >
            {mode === 'daily' ? 'Daily overlap' : 'Weekly heatmap'}
          </button>
        ))}
      </div>
      {calMode === 'daily' ? <DailyTimeline /> : <WeeklyHeatmap />}
    </div>
  );
}

function DailyTimeline() {
  const members = useStore((s) => s.activeTeam().members);
  const refTz = useStore((s) => s.settings.refTz);
  const scrubOffsetMin = useStore((s) => s.scrubOffsetMin);
  const d = useEvalDate();

  const refOff = tzOffsetMin(refTz, d);
  const nowFrac = useMemo(() => {
    const p = tzParts(refTz, d);
    return (p.h + p.mi / 60) / 24;
  }, [refTz, d]);

  const axis: number[] = [];
  for (let h = 0; h <= 24; h += 3) axis.push(h);

  const sorted = useMemo(
    () => [...members].sort((a, b) => tzOffsetMin(b.tz, d) - tzOffsetMin(a.tz, d)),
    [members, d],
  );

  return (
    <>
      <div className="overflow-hidden rounded-card border border-line bg-panel py-[6px]">
        <div className="grid grid-cols-[200px_1fr] items-center px-4 pb-1 pt-2 text-[11px] text-muted max-[560px]:grid-cols-[130px_1fr]">
          <div>Member · local time</div>
          <div className="relative h-[18px]">
            {axis.map((h) => (
              <span
                key={h}
                className="tnum absolute -translate-x-1/2"
                style={{ left: `${(h / 24) * 100}%` }}
              >
                {String(h % 24).padStart(2, '0')}
              </span>
            ))}
          </div>
        </div>

        {sorted.map((m) => {
          const off = tzOffsetMin(m.tz, d);
          const delta = (refOff - off) / 60;
          const f = fmtTime(m.tz, d);
          const st = statusOf(m, d);
          const workBands = bandsToRef(m.workStart, m.workEnd, delta);
          const awakeBands = bandsToRef(7, 23, delta);
          return (
            <div
              key={m.id}
              className="grid grid-cols-[200px_1fr] items-center border-t border-line px-4 py-[9px] max-[560px]:grid-cols-[130px_1fr]"
            >
              <div className="flex min-w-0 items-center gap-[9px]">
                <span
                  className="h-[9px] w-[9px] flex-none rounded-full"
                  style={{ background: STATUS_META[st].color }}
                />
                <span className="truncate font-semibold">{m.name}</span>
                <span className="tnum ml-auto pl-2 text-xs text-muted">
                  {f.hhmm}
                </span>
              </div>
              <div className="tl-track">
                {awakeBands.map((b, i) => (
                  <div
                    key={`a${i}`}
                    className="tl-band awake"
                    style={{
                      left: `${(b[0] / 24) * 100}%`,
                      width: `${((b[1] - b[0]) / 24) * 100}%`,
                    }}
                  />
                ))}
                {workBands.map((b, i) => (
                  <div
                    key={`w${i}`}
                    className="tl-band"
                    style={{
                      left: `${(b[0] / 24) * 100}%`,
                      width: `${((b[1] - b[0]) / 24) * 100}%`,
                    }}
                  />
                ))}
                <div className="tl-nowline" style={{ left: `${nowFrac * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-[14px] flex items-center gap-2 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="h-3 w-[18px] rounded-[3px] bg-green/50" /> Working hours
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-[18px] rounded-[3px] bg-amber/30" /> Awake
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-[3px] bg-red" />{' '}
          {scrubOffsetMin ? 'Preview time' : 'Now'}
        </span>
        <span className="ml-auto">
          Columns = hours in{' '}
          <b className="text-text">{shortTz(refTz)}</b> time
        </span>
      </div>
    </>
  );
}

function WeeklyHeatmap() {
  const members = useStore((s) => s.activeTeam().members);
  const refTz = useStore((s) => s.settings.refTz);
  const d = useEvalDate();

  const { grid, dayLabels } = useMemo(() => {
    const refOff = tzOffsetMin(refTz, d);
    const refP = tzParts(refTz, d);
    const back = (refP.wd + 6) % 7; // days since Monday

    const grid: Array<Array<{ c: number; names: string[] }>> = [];
    for (let h = 0; h < 24; h++) {
      grid[h] = [];
      for (let di = 0; di < 7; di++) grid[h][di] = { c: 0, names: [] };
    }

    const dayLabels: Array<{ d: string; num: number; today: boolean }> = [];
    for (let di = 0; di < 7; di++) {
      const dayShift = di - back;
      for (let h = 0; h < 24; h++) {
        const baseUTC =
          Date.UTC(refP.y, refP.mo - 1, refP.d + dayShift, h, 0) - refOff * 60000;
        members.forEach((m) => {
          const moff = tzOffsetMin(m.tz, new Date(baseUTC));
          const ld = new Date(baseUTC + moff * 60000);
          const lwd = ld.getUTCDay();
          const lh = ld.getUTCHours() + ld.getUTCMinutes() / 60;
          if (m.days.includes(lwd) && lh >= m.workStart && lh < m.workEnd) {
            grid[h][di].c++;
            grid[h][di].names.push(m.name);
          }
        });
      }
      const lblDate = new Date(Date.UTC(refP.y, refP.mo - 1, refP.d + dayShift));
      dayLabels.push({
        d: DAYS[(1 + di) % 7],
        num: lblDate.getUTCDate(),
        today: dayShift === 0,
      });
    }
    return { grid, dayLabels };
  }, [members, refTz, d]);

  const maxC = members.length || 1;

  return (
    <div className="overflow-x-auto rounded-card border border-line bg-panel p-4">
      <table className="w-full min-w-[560px] border-collapse">
        <thead>
          <tr>
            <th />
            {dayLabels.map((l) => (
              <th key={l.d} className="p-1 text-[11px] font-bold text-muted">
                {l.d}
                <br />
                <span
                  className="text-[10px]"
                  style={{ color: l.today ? 'var(--color-accent)' : 'var(--color-muted)' }}
                >
                  {l.num}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 24 }, (_, h) => (
            <tr key={h}>
              <td className="tnum whitespace-nowrap pr-2 text-right text-[11px] text-muted">
                {String(h).padStart(2, '0')}:00
              </td>
              {dayLabels.map((_, di) => {
                const cell = grid[h][di];
                const ratio = cell.c / maxC;
                const bg =
                  ratio === 0 ? '#10151e' : `rgba(52,211,153,${0.15 + ratio * 0.8})`;
                return (
                  <td
                    key={di}
                    title={cell.c > 0 ? cell.names.join(', ') : undefined}
                    className="h-[17px] w-[13%] rounded-[3px] border border-bg text-center text-[10px] font-bold"
                    style={{ background: bg, color: ratio > 0.45 ? '#06121f' : '#7d8aa0' }}
                  >
                    {cell.c > 0 ? cell.c : ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-[14px] flex items-center gap-2 text-xs text-muted">
        <span>Fewer</span>
        <span className="h-3 w-[18px] rounded-[3px] bg-green/20" />
        <span className="h-3 w-[18px] rounded-[3px] bg-green/50" />
        <span className="h-3 w-[18px] rounded-[3px] bg-green/[0.95]" />
        <span>More people working</span>
        <span className="ml-auto">
          Hours &amp; days in <b className="text-text">{shortTz(refTz)}</b> ·
          number = teammates available · hover for names
        </span>
      </div>
    </div>
  );
}
