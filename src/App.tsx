import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Scrubber } from '@/components/Scrubber';
import { Globe } from '@/components/Globe';
import { PersonList } from '@/components/PersonList';
import { PersonForm } from '@/components/PersonForm';
import { Tooltip } from '@/components/ui/Tooltip';
import { useTick } from '@/hooks/useTick';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';

export default function App() {
  useTick();
  useTheme();

  const [form, setForm] = useState<{ open: boolean; personId: string | null }>({
    open: false,
    personId: null,
  });
  const [tab, setTab] = useState<'globe' | 'list'>('globe');

  const openAdd = () => setForm({ open: true, personId: null });
  const openEdit = (id: string) => setForm({ open: true, personId: id });
  const closeForm = () => setForm((f) => ({ ...f, open: false }));

  return (
    <>
      <Navbar onAdd={openAdd} />

      <main className="mx-auto max-w-7xl px-4 py-6 pb-24">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-grey-200 p-1 md:hidden dark:bg-grey-800">
          {(
            [
              ['globe', 'Globe', 'Show the globe'],
              ['list', 'List', 'Show the people list'],
            ] as const
          ).map(([id, label, tip]) => (
            <Tooltip key={id} label={tip} className="w-full">
              <button
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'w-full rounded-lg py-1.5 text-sm font-medium transition',
                  tab === id
                    ? 'bg-white text-grey-900 shadow-sm dark:bg-grey-950 dark:text-grey-100'
                    : 'text-grey-500',
                )}
              >
                {label}
              </button>
            </Tooltip>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
          <section
            aria-label="Globe"
            className={cn(
              'min-w-0 rounded-2xl border border-grey-200 bg-white p-4 dark:border-grey-800 dark:bg-grey-900',
              tab !== 'globe' && 'hidden md:block',
            )}
          >
            <Globe />
          </section>

          <section aria-label="People" className={cn('min-w-0', tab !== 'list' && 'hidden md:block')}>
            <PersonList onAdd={openAdd} onEdit={openEdit} />
          </section>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-grey-200 bg-white/90 backdrop-blur dark:border-grey-800 dark:bg-grey-950/90">
        <Scrubber />
      </div>

      <PersonForm open={form.open} personId={form.personId} onClose={closeForm} />
    </>
  );
}
