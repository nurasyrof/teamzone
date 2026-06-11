import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import {
  findZoneFromTime,
  fmtOffset,
  fmtTime,
  guessLocalTz,
  isValidTz,
  shortTz,
  supportedTimeZones,
  tzOffsetMin,
} from '@/lib/time';
import { DAYS } from '@/lib/util';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, SelectInput, TextInput } from '@/components/ui/Field';
import { toast } from '@/components/ui/Toast';

interface Props {
  open: boolean;
  /** Member id when editing; null when adding. */
  memberId: string | null;
  onClose: () => void;
}

const DEFAULT_DAYS = [1, 2, 3, 4, 5];

function hourOptions() {
  const opts: Array<{ value: number; label: string }> = [];
  for (let i = 0; i <= 24; i++) {
    const ap = i < 12 ? 'am' : i === 24 ? 'am' : 'pm';
    let x = i % 12;
    if (x === 0) x = 12;
    opts.push({ value: i, label: `${String(i).padStart(2, '0')}:00 (${x}${ap})` });
  }
  return opts;
}

export function MemberDialog({ open, memberId, onClose }: Props) {
  const members = useStore((s) => s.activeTeam().members);
  const addMember = useStore((s) => s.addMember);
  const updateMember = useStore((s) => s.updateMember);
  const deleteMember = useStore((s) => s.deleteMember);

  const editing = memberId ? members.find((m) => m.id === memberId) : undefined;
  const zones = useMemo(() => supportedTimeZones(), []);
  const hours = useMemo(() => hourOptions(), []);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [tz, setTz] = useState('UTC');
  const [curTime, setCurTime] = useState('');
  const [workStart, setWorkStart] = useState(9);
  const [workEnd, setWorkEnd] = useState(17);
  const [days, setDays] = useState<number[]>(DEFAULT_DAYS);

  // Reset the form whenever the dialog opens (or target member changes).
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setRole(editing.role);
      setTz(editing.tz);
      setWorkStart(editing.workStart);
      setWorkEnd(editing.workEnd);
      setDays([...editing.days]);
    } else {
      setName('');
      setRole('');
      setTz(guessLocalTz());
      setWorkStart(9);
      setWorkEnd(17);
      setDays(DEFAULT_DAYS);
    }
    setCurTime('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, memberId]);

  const preview = useMemo(() => {
    if (!tz.trim() || !isValidTz(tz)) return null;
    const f = fmtTime(tz, new Date());
    return `Right now there: ${f.hhmm} (${f.parts.dateStr}, ${fmtOffset(
      tzOffsetMin(tz, new Date()),
    )})`;
  }, [tz]);

  function toggleDay(i: number) {
    setDays((cur) =>
      cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i],
    );
  }

  function findZone() {
    const best = findZoneFromTime(curTime);
    if (!best) {
      toast('Enter time like 15:45 or 3:45pm');
      return;
    }
    setTz(best);
    toast(`Matched to ${shortTz(best)} (${fmtOffset(tzOffsetMin(best, new Date()))})`);
  }

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return toast('Name is required');
    if (!isValidTz(tz.trim())) return toast('Pick a valid timezone');
    if (!days.length) return toast('Select at least one work day');

    const draft = {
      name: trimmed,
      role: role.trim(),
      tz: tz.trim(),
      workStart,
      workEnd,
      days: [...days].sort((a, b) => a - b),
    };
    if (editing) {
      updateMember(editing.id, draft);
      toast('Updated');
    } else {
      addMember(draft);
      toast('Member added');
    }
    onClose();
  }

  function remove() {
    if (!editing) return;
    deleteMember(editing.id);
    toast('Member removed');
    onClose();
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit member' : 'Add member'}
      onClose={onClose}
      footer={
        <>
          {editing && (
            <Button variant="danger" className="mr-auto" onClick={remove}>
              Delete
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save member
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-[14px]">
        <Field label="Name">
          <TextInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya Sharma"
          />
        </Field>
        <Field label="Role">
          <TextInput
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Backend Engineer"
          />
        </Field>
      </div>

      <Field
        label="Timezone"
        hint={
          preview ?? <span className="text-red">Unknown timezone</span>
        }
      >
        <TextInput
          list="tzlist"
          value={tz}
          autoComplete="off"
          onChange={(e) => setTz(e.target.value)}
          placeholder="Search… e.g. Asia/Tokyo"
        />
        <datalist id="tzlist">
          {zones.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>
      </Field>

      <div className="flex items-end gap-2">
        <Field label="…or set by their current time" className="flex-1">
          <TextInput
            value={curTime}
            autoComplete="off"
            onChange={(e) => setCurTime(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && findZone()}
            placeholder="HH:MM (24h), e.g. 15:45"
          />
        </Field>
        <Button type="button" onClick={findZone}>
          Find zone
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-[14px]">
        <Field label="Work starts">
          <SelectInput
            value={workStart}
            onChange={(e) => setWorkStart(+e.target.value)}
          >
            {hours.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Work ends">
          <SelectInput value={workEnd} onChange={(e) => setWorkEnd(+e.target.value)}>
            {hours.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <Field label="Work days">
        <div className="flex flex-wrap gap-[5px]">
          {DAYS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`w-[42px] rounded-lg border py-[7px] text-xs font-bold ${
                days.includes(i)
                  ? 'border-transparent bg-accent text-ink'
                  : 'border-line bg-panel2 text-muted'
              }`}
            >
              {label.slice(0, 2)}
            </button>
          ))}
        </div>
      </Field>
    </Modal>
  );
}
