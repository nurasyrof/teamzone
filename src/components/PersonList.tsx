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
import { IconPlus } from './icons';
import { Tooltip } from './ui/Tooltip';
import { downloadCsv, parseCsvFile } from '@/lib/csv';

interface PersonListProps {
  onAdd: () => void;
  onEdit: (id: string) => void;
}

export function PersonList({ onAdd, onEdit }: PersonListProps) {
  const people = useStore((s) => s.people);
  const roleFilter = useStore((s) => s.roleFilter);
  const setRoleFilter = useStore((s) => s.setRoleFilter);
  const movePerson = useStore((s) => s.movePerson);
  const importPeople = useStore((s) => s.importPeople);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const roles = useMemo(
    () => [...new Set(people.map((p) => p.role).filter(Boolean))].sort(),
    [people],
  );
  const visible = roleFilter ? people.filter((p) => p.role === roleFilter) : people;

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
        <h2 className="font-heading text-base font-bold">
          People <span className="font-normal text-grey-400">({people.length})</span>
        </h2>
        <div className="ml-auto flex items-center gap-2">
          {roles.length > 0 && (
            <Tooltip label="Show only one role">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by role"
                className="rounded-lg border border-grey-300 bg-white px-2 py-1.5 text-xs text-grey-600 outline-none focus:border-accent dark:border-grey-700 dark:bg-grey-950 dark:text-grey-300"
              >
                <option value="">All roles</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Tooltip>
          )}
          <Tooltip label="Add people from a CSV file">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-grey-300 px-2.5 py-1.5 text-xs font-medium text-grey-600 hover:border-accent hover:text-accent dark:border-grey-700 dark:text-grey-300 dark:hover:border-grey-400 dark:hover:text-grey-100"
            >
              Import CSV
            </button>
          </Tooltip>
          <Tooltip label="Download the roster as CSV">
            <button
              type="button"
              onClick={() => downloadCsv(people)}
              disabled={people.length === 0}
              className="rounded-lg border border-grey-300 px-2.5 py-1.5 text-xs font-medium text-grey-600 hover:border-accent hover:text-accent disabled:opacity-40 dark:border-grey-700 dark:text-grey-300 dark:hover:border-grey-400 dark:hover:text-grey-100"
            >
              Export
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
