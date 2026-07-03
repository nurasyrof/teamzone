import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Modal } from './ui/Modal';
import { Tooltip } from './ui/Tooltip';
import { CityPicker, CITIES } from './CityPicker';
import { formatTime, zoneFromLocalTime } from '@/lib/time';
import { cn } from '@/lib/cn';
import type { CityEntry, PersonDraft } from '@/types';

interface PersonFormProps {
  open: boolean;
  personId: string | null;
  onClose: () => void;
}

type Mode = 'city' | 'time';

export function PersonForm({ open, personId, onClose }: PersonFormProps) {
  const people = useStore((s) => s.people);
  const addPerson = useStore((s) => s.addPerson);
  const editPerson = useStore((s) => s.editPerson);

  const editing = personId ? (people.find((p) => p.id === personId) ?? null) : null;

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [mode, setMode] = useState<Mode>('city');
  const [city, setCity] = useState<CityEntry | null>(null);
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setName(editing?.name ?? '');
    setRole(editing?.role ?? '');
    if (editing?.approximate) {
      setMode('time');
      setCity(null);
      setTime(formatTime(Date.now(), editing.timezoneId));
    } else {
      setMode('city');
      setTime('');
      setCity(
        editing
          ? (CITIES.find(
              (c) => c.timezoneId === editing.timezoneId && c.city === editing.city,
            ) ?? {
              city: editing.city,
              country: '',
              timezoneId: editing.timezoneId,
              lat: editing.lat ?? 0,
              lng: editing.lng ?? 0,
            })
          : null,
      );
    }
  }, [open, editing]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    let draft: PersonDraft;
    if (mode === 'city') {
      if (!city) {
        setError('Pick a city — it gives an exact, DST-proof timezone and a globe pin.');
        return;
      }
      draft = {
        name: name.trim(),
        role: role.trim(),
        timezoneId: city.timezoneId,
        city: city.city,
        lat: city.lat,
        lng: city.lng,
        approximate: false,
      };
    } else {
      const zone = zoneFromLocalTime(time, Date.now());
      if (!zone) {
        setError('Enter their current local time as hh:mm — no matching timezone was found.');
        return;
      }
      draft = {
        name: name.trim(),
        role: role.trim(),
        timezoneId: zone,
        city: '',
        lat: null,
        lng: null,
        approximate: true,
      };
    }

    if (editing) editPerson(editing.id, draft);
    else addPerson(draft);
    onClose();
  };

  const inputClass =
    'w-full rounded-lg border border-grey-300 bg-white px-3 py-2 text-sm outline-none focus:border-accent dark:border-grey-700 dark:bg-grey-950';

  return (
    <Modal open={open} title={editing ? 'Edit person' : 'Add person'} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Name
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Role <span className="-mt-1 text-xs font-normal text-grey-400">optional</span>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Designer"
            className={inputClass}
          />
        </label>

        <div>
          <div className="mb-2 grid grid-cols-2 gap-1 rounded-lg bg-grey-100 p-1 dark:bg-grey-800">
            {(
              [
                ['city', 'Pick their city', 'Exact DST-proof timezone with a globe pin'],
                ['time', 'I only know their time', 'Fallback: guesses a zone from their clock time'],
              ] as const
            ).map(([m, label, tip]) => (
              <Tooltip key={m} label={tip} className="w-full">
                <button
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError('');
                  }}
                  className={cn(
                    'w-full rounded-md py-1.5 text-xs font-medium transition',
                    mode === m
                      ? 'bg-white text-grey-900 shadow-sm dark:bg-grey-950 dark:text-grey-100'
                      : 'text-grey-500',
                  )}
                >
                  {label}
                </button>
              </Tooltip>
            ))}
          </div>

          {mode === 'city' ? (
            <CityPicker value={city} onSelect={setCity} />
          ) : (
            <div className="flex flex-col gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label="Their current local time"
                className={inputClass}
              />
              <p className="rounded-lg border-l-2 border-accent bg-grey-100 px-3 py-2 text-xs text-grey-600 dark:bg-grey-800 dark:text-grey-300">
                <strong>Approximate.</strong> A typed time only pins down a fixed UTC offset: it
                can drift at daylight-saving changes and this person won't appear on the globe.
                Prefer picking a city if you know it.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-xs font-medium text-grey-900 dark:text-grey-100">
            {error}
          </p>
        )}

        <div className="mt-1 flex justify-end gap-2">
          <Tooltip label="Discard and close">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-grey-300 px-4 py-2 text-sm font-medium text-grey-600 hover:border-grey-400 dark:border-grey-700 dark:text-grey-300"
            >
              Cancel
            </button>
          </Tooltip>
          <Tooltip label={editing ? 'Save this person' : 'Add them to the team'}>
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-grey-200 dark:text-grey-900"
            >
              {editing ? 'Save changes' : 'Add person'}
            </button>
          </Tooltip>
        </div>
      </form>
    </Modal>
  );
}
