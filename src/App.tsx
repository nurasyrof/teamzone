import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Header } from '@/components/Header';
import { Scrubber } from '@/components/Scrubber';
import { NowView } from '@/components/views/NowView';
import { CalendarView } from '@/components/views/CalendarView';
import { MapView } from '@/components/views/MapView';
import { MemberDialog } from '@/components/MemberDialog';
import { EmptyState } from '@/components/EmptyState';
import { Toaster } from '@/components/ui/Toast';

export default function App() {
  const view = useStore((s) => s.settings.view);
  const memberCount = useStore((s) => s.activeTeam().members.length);

  const [dialog, setDialog] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  const openAdd = () => setDialog({ open: true, id: null });
  const openEdit = (id: string) => setDialog({ open: true, id });
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  return (
    <>
      <Header onAdd={openAdd} />
      <Scrubber />
      <main className="mx-auto max-w-[1300px] p-[22px]">
        {memberCount === 0 && view !== 'map' ? (
          <EmptyState onAdd={openAdd} />
        ) : view === 'now' ? (
          <NowView onEdit={openEdit} />
        ) : view === 'calendar' ? (
          <CalendarView />
        ) : (
          <MapView />
        )}
      </main>

      <MemberDialog open={dialog.open} memberId={dialog.id} onClose={closeDialog} />
      <Toaster />
    </>
  );
}
