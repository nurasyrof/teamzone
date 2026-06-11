import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, TextInput } from '@/components/ui/Field';
import { toast } from '@/components/ui/Toast';

export function TeamSwitcher() {
  const teams = useStore((s) => s.teams);
  const activeTeamId = useStore((s) => s.activeTeamId);
  const setActiveTeam = useStore((s) => s.setActiveTeam);
  const addTeam = useStore((s) => s.addTeam);
  const renameTeam = useStore((s) => s.renameTeam);
  const deleteTeam = useStore((s) => s.deleteTeam);

  const active = teams.find((t) => t.id === activeTeamId) ?? teams[0];

  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<null | { mode: 'add' | 'rename'; id?: string }>(null);
  const [name, setName] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function openAdd() {
    setName('');
    setDialog({ mode: 'add' });
    setOpen(false);
  }
  function openRename(id: string, current: string) {
    setName(current);
    setDialog({ mode: 'rename', id });
    setOpen(false);
  }
  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast('Team name is required');
      return;
    }
    if (dialog?.mode === 'add') {
      addTeam(trimmed);
      toast(`Created "${trimmed}"`);
    } else if (dialog?.mode === 'rename' && dialog.id) {
      renameTeam(dialog.id, trimmed);
      toast('Team renamed');
    }
    setDialog(null);
  }
  function onDelete(id: string, teamName: string) {
    if (teams.length <= 1) {
      toast('Keep at least one team');
      return;
    }
    if (confirm(`Delete team "${teamName}" and all its members?`)) {
      deleteTeam(id);
      toast('Team deleted');
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <Button variant="ghost" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <span className="max-w-[160px] truncate">{active?.name ?? 'Team'}</span>
        <span className="text-muted">▾</span>
      </Button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-40 w-[260px] rounded-xl border border-line bg-panel p-1 shadow-float">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.6px] text-muted">
            Teams
          </div>
          {teams.map((t) => (
            <div
              key={t.id}
              className={`group flex items-center gap-2 rounded-lg px-2 py-[7px] ${
                t.id === activeTeamId ? 'bg-panel2' : 'hover:bg-panel2'
              }`}
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => {
                  setActiveTeam(t.id);
                  setOpen(false);
                }}
              >
                <span
                  className={`h-2 w-2 flex-none rounded-full ${
                    t.id === activeTeamId ? 'bg-accent' : 'bg-line'
                  }`}
                />
                <span className="truncate font-semibold">{t.name}</span>
                <span className="ml-auto flex-none text-[11px] text-muted">
                  {t.members.length}
                </span>
              </button>
              <button
                className="text-muted opacity-0 transition group-hover:opacity-100 hover:text-text"
                title="Rename"
                onClick={() => openRename(t.id, t.name)}
              >
                ✎
              </button>
              <button
                className="text-muted opacity-0 transition group-hover:opacity-100 hover:text-red"
                title="Delete"
                onClick={() => onDelete(t.id, t.name)}
              >
                🗑
              </button>
            </div>
          ))}
          <div className="mt-1 border-t border-line p-1">
            <button
              className="w-full rounded-lg px-2 py-[9px] text-left text-[13px] font-semibold text-accent hover:bg-panel2"
              onClick={openAdd}
            >
              + New team
            </button>
          </div>
        </div>
      )}

      <Modal
        open={dialog !== null}
        title={dialog?.mode === 'add' ? 'New team' : 'Rename team'}
        onClose={() => setDialog(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submit}>
              Save
            </Button>
          </>
        }
      >
        <Field label="Team name">
          <TextInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="e.g. Platform Squad"
          />
        </Field>
      </Modal>
    </div>
  );
}
