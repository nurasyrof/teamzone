import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '@/store/useStore';
import { avatarColor, initials } from '@/lib/avatar';
import { dayDifferenceLabel, formatTime, offsetLabel, relativeLabel, zoneOffsetMinutes } from '@/lib/time';
import { IconApproximate, IconClose, IconDragHandle, IconPencil } from './icons';
import { Tooltip } from './ui/Tooltip';
import { cn } from '@/lib/cn';
import type { Person } from '@/types';

interface PersonRowProps {
  person: Person;
  onEdit: (id: string) => void;
}

export function PersonRow({ person, onEdit }: PersonRowProps) {
  const referenceInstant = useStore((s) => s.referenceInstant);
  const referenceZoneId = useStore((s) => s.referenceZoneId);
  const removePerson = useStore((s) => s.removePerson);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: person.id,
  });

  const place =
    person.city || offsetLabel(zoneOffsetMinutes(person.timezoneId, referenceInstant));
  const dayDiff = dayDifferenceLabel(person.timezoneId, referenceZoneId, referenceInstant);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl border border-grey-200 bg-white p-3 dark:border-grey-800 dark:bg-grey-900',
        isDragging && 'z-10 shadow-lg',
      )}
    >
      <Tooltip label="Drag to reorder">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${person.name}`}
          className="cursor-grab touch-none text-grey-300 hover:text-grey-500 active:cursor-grabbing dark:text-grey-600 dark:hover:text-grey-400"
        >
          <IconDragHandle className="size-4" />
        </button>
      </Tooltip>

      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: avatarColor(person.accentSeed ?? person.name) }}
      >
        {initials(person.name)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="truncate font-heading font-semibold">
          {person.name}
          {person.approximate && (
            <Tooltip
              label="Approximate: guessed from a typed time — may drift at DST, no globe pin"
              className="ml-1.5 cursor-help align-middle text-grey-400"
            >
              <IconApproximate className="size-3.5" />
            </Tooltip>
          )}
        </div>
        <div className="truncate text-xs text-grey-500">
          {[person.role, place].filter(Boolean).join(' · ')}
        </div>
      </div>

      <div className="text-right">
        <div className="font-heading text-lg font-bold tabular-nums">
          {formatTime(referenceInstant, person.timezoneId)}
        </div>
        <div className="text-xs text-grey-500">
          {relativeLabel(person.timezoneId, referenceZoneId, referenceInstant)}
          {dayDiff && ` · ${dayDiff}`}
        </div>
      </div>

      <div className="flex flex-col gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
        <Tooltip label={`Edit ${person.name}`}>
          <button
            type="button"
            onClick={() => onEdit(person.id)}
            aria-label={`Edit ${person.name}`}
            className="flex items-center rounded p-1 text-grey-400 hover:text-accent dark:hover:text-grey-100"
          >
            <IconPencil className="size-3.5" />
          </button>
        </Tooltip>
        <Tooltip label={`Remove ${person.name}`}>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Remove ${person.name}?`)) removePerson(person.id);
            }}
            aria-label={`Remove ${person.name}`}
            className="flex items-center rounded p-1 text-grey-400 hover:text-grey-900 dark:hover:text-grey-100"
          >
            <IconClose className="size-3.5" />
          </button>
        </Tooltip>
      </div>
    </li>
  );
}
