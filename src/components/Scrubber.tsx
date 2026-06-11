import { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useEvalDate } from '@/lib/useClock';
import { fmtTime, shortTz, supportedTimeZones } from '@/lib/time';
import { Button } from '@/components/ui/Button';
import { SelectInput } from '@/components/ui/Field';

export function Scrubber() {
  const scrubOffsetMin = useStore((s) => s.scrubOffsetMin);
  const setScrub = useStore((s) => s.setScrub);
  const resetScrub = useStore((s) => s.resetScrub);
  const refTz = useStore((s) => s.settings.refTz);
  const setRefTz = useStore((s) => s.setRefTz);
  const d = useEvalDate();

  const zones = useMemo(() => supportedTimeZones(), []);
  const live = scrubOffsetMin === 0;

  let label: string;
  if (live) {
    label = 'Live — now';
  } else {
    const sign = scrubOffsetMin > 0 ? '+' : '−';
    const a = Math.abs(scrubOffsetMin);
    const h = Math.floor(a / 60);
    const mi = a % 60;
    label = `Preview ${fmtTime(refTz, d).hhmm} (${sign}${h}h${mi ? ' ' + mi + 'm' : ''})`;
  }

  return (
    <div className="flex flex-wrap items-center gap-[14px] border-b border-line bg-panel px-[22px] py-3">
      <span className="text-xs font-bold uppercase tracking-[0.6px] text-muted">
        Time
      </span>
      <input
        type="range"
        className="scrub-range min-w-[200px] flex-1"
        min={-720}
        max={720}
        step={15}
        value={scrubOffsetMin}
        onChange={(e) => setScrub(+e.target.value)}
      />
      <div
        className={`tnum min-w-[230px] font-bold ${
          live ? 'text-green' : 'text-amber'
        }`}
      >
        {label}
      </div>
      {!live && (
        <Button variant="ghost" onClick={resetScrub}>
          Reset to now
        </Button>
      )}
      <span className="ml-[6px] text-xs font-bold uppercase tracking-[0.6px] text-muted">
        Reference
      </span>
      <SelectInput
        className="w-auto py-[7px]"
        value={refTz}
        onChange={(e) => setRefTz(e.target.value)}
      >
        {zones.map((z) => (
          <option key={z} value={z}>
            {shortTz(z)}
          </option>
        ))}
      </SelectInput>
    </div>
  );
}
