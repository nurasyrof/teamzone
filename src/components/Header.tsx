import { useRef } from 'react';
import { useStore } from '@/store/useStore';
import { useEvalDate } from '@/lib/useClock';
import { fmtTime, shortTz } from '@/lib/time';
import type { Member, ViewId } from '@/types';
import { Button } from '@/components/ui/Button';
import { TeamSwitcher } from '@/components/TeamSwitcher';
import { toast } from '@/components/ui/Toast';

const TABS: Array<{ id: ViewId; label: string }> = [
  { id: 'now', label: 'Now' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'map', label: 'Map' },
];

export function Header({ onAdd }: { onAdd: () => void }) {
  const view = useStore((s) => s.settings.view);
  const setView = useStore((s) => s.setView);
  const refTz = useStore((s) => s.settings.refTz);
  const members = useStore((s) => s.activeTeam().members);
  const teamName = useStore((s) => s.activeTeam().name);
  const replaceMembers = useStore((s) => s.replaceMembers);
  const d = useEvalDate(1000);
  const fileRef = useRef<HTMLInputElement>(null);

  const f = fmtTime(refTz, d);

  function exportJson() {
    const blob = new Blob([JSON.stringify(members, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${teamName.toLowerCase().replace(/\s+/g, '-')}-members.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const arr = JSON.parse(String(r.result));
        if (!Array.isArray(arr)) throw new Error('not an array');
        replaceMembers(arr as Member[]);
        toast(`Imported ${arr.length} members`);
      } catch {
        toast('Invalid JSON file');
      }
    };
    r.readAsText(file);
    e.target.value = '';
  }

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-4 border-b border-line bg-[rgba(246,247,249,0.85)] px-[22px] py-4 backdrop-blur-[8px]">
      <div className="flex items-center gap-[10px] text-[17px] font-bold tracking-[0.2px]">
        <div className="h-[22px] w-[22px] bg-accent" />
        TeamZone
      </div>

      <div className="tnum text-muted">
        Reference: <b className="font-semibold text-text">{f.hhmm}</b> ·{' '}
        {f.parts.dateStr} · {shortTz(refTz)}
      </div>

      <div className="flex gap-[2px] border border-line bg-panel p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`px-[14px] py-[7px] text-[13px] font-semibold transition-colors ${
              view === t.id
                ? 'bg-accent text-white'
                : 'text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <TeamSwitcher />

      <div className="flex-1" />

      <Button variant="ghost" onClick={() => fileRef.current?.click()} title="Import JSON">
        Import
      </Button>
      <Button variant="ghost" onClick={exportJson} title="Export JSON">
        Export
      </Button>
      <Button variant="primary" onClick={onAdd}>
        + Add member
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={importJson}
      />
    </header>
  );
}
