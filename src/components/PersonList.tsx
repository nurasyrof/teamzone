import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useStore } from '@/store/useStore';
import { PersonRow } from './PersonRow';
import { IconPencil, IconPlus, IconToggleOff, IconToggleOn, IconUpload } from './icons';
import { Tooltip } from './ui/Tooltip';
import { Dropdown } from './ui/Dropdown';
import { parseCsvFile } from '@/lib/csv';
import { hourInZone } from '@/lib/time';
import { cn } from '@/lib/cn';

interface PersonListProps {
  onAdd: () => void;
  onEdit: (id: string) => void;
}

export function PersonList({ onAdd, onEdit }: PersonListProps) {
  const teamName = useStore((s) => s.teamName);
  const setTeamName = useStore((s) => s.setTeamName);
  const people = useStore((s) => s.people);
  const roleFilter = useStore((s) => s.roleFilter);
  const setRoleFilter = useStore((s) => s.setRoleFilter);
  const daytimeOnly = useStore((s) => s.daytimeOnly);
  const setDaytimeOnly = useStore((s) => s.setDaytimeOnly);
  const referenceInstant = useStore((s) => s.referenceInstant);
  const movePerson = useStore((s) => s.movePerson);
  const importPeople = useStore((s) => s.importPeople);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const startRename = () => {
    setNameDraft(teamName);
    setEditingName(true);
  };
  const commitRename = () => {
    setTeamName(nameDraft);
    setEditingName(false);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const roles = useMemo(
    () => [...new Set(people.map((p) => p.role).filter(Boolean))].sort(),
    [people],
  );
  const isDaytime = (zone: string) => {
    const h = hourInZone(referenceInstant, zone);
    return h >= 6 && h < 18;
  };
  const visible = people.filter(
    (p) =>
      (!roleFilter || p.role === roleFilter) && (!daytimeOnly || isDaytime(p.timezoneId)),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) movePerson(String(active.id), String(over.id));
  };

  const onImportFile = async (file: File) => {
    const { people: drafts, errors } = await parseCsvFile(file);
    if (drafts.length) importPeople(drafts);
    setImportStatus(
      [
        drafts.length ? `Imported ${drafts.length}` : 'Nothing imported',
        errors.length ? `${errors.length} row${errors.length > 1 ? 's' : ''} skipped` : '',
      ]
        .filter(Boolean)
        .join(' · ') + (errors.length ? ` — ${errors[0]}` : ''),
    );
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {editingName ? (
          <input
            autoFocus
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              else if (e.key === 'Escape') setEditingName(false);
            }}
            aria-label="Team name"
            placeholder="My team"
            className="w-44 rounded-md border border-grey-300 bg-white px-2 py-1 font-heading text-base font-bold outline-none focus:border-accent dark:border-grey-700 dark:bg-grey-950"
          />
        ) : (
          <h2 className="flex items-center gap-1.5 font-heading text-base font-bold">
            <span className="max-w-56 truncate">{teamName}</span>
            <span className="font-normal text-grey-400">({people.length})</span>
            <Tooltip label="Rename team">
              <button
                type="button"
                onClick={startRename}
                aria-label="Rename team"
                className="flex items-center rounded p-1 text-grey-400 hover:text-accent dark:hover:text-grey-100"
              >
                <IconPencil className="size-3.5" />
              </button>
            </Tooltip>
          </h2>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Tooltip label="Show only people in working hours (06:00–18:00 local)">
            <button
              type="button"
              onClick={() => setDaytimeOnly(!daytimeOnly)}
              role="switch"
              aria-checked={daytimeOnly}
              aria-label="Daytime only"
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
                daytimeOnly
                  ? 'border-accent text-accent dark:border-grey-400 dark:text-grey-100'
                  : 'border-grey-300 text-grey-500 dark:border-grey-700',
              )}
            >
              {daytimeOnly ? (
                <IconToggleOn className="size-4" />
              ) : (
                <IconToggleOff className="size-4" />
              )}
              Daytime only
            </button>
          </Tooltip>
          {roles.length > 0 && (
            <Dropdown
              value={roleFilter}
              onChange={setRoleFilter}
              ariaLabel="Filter by role"
              options={[
                { value: '', label: 'All roles' },
                ...roles.map((r) => ({ value: r, label: r })),
              ]}
            />
          )}
          <Tooltip
            align="right"
            label="Import a CSV with columns: name, role, timezoneId, city, lat, lng. name + timezoneId (IANA, e.g. Asia/Jakarta) are required; lat/lng place the globe pin."
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-grey-300 px-2.5 py-1.5 text-xs font-medium text-grey-600 hover:border-accent hover:text-accent dark:border-grey-700 dark:text-grey-300 dark:hover:border-grey-400 dark:hover:text-grey-100"
            >
              <IconUpload className="size-4" />
              Import
            </button>
          </Tooltip>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {importStatus && (
        <p role="status" className="mb-3 text-xs text-grey-500">
          {importStatus}
        </p>
      )}

      {people.length === 0 ? (
        <div className="rounded-xl border border-dashed border-grey-300 p-8 text-center dark:border-grey-700">
          <p className="mb-1 font-heading font-semibold">No one here yet</p>
          <p className="mb-4 text-sm text-grey-500">
            Add your teammates to see their local time on the globe and in this list.
          </p>
          <Tooltip label="Open the add-person form">
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-grey-200 dark:text-grey-900"
            >
              <IconPlus className="size-3.5" />
              Add your first person
            </button>
          </Tooltip>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={visible.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {visible.map((person) => (
                <PersonRow key={person.id} person={person} onEdit={onEdit} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
