import { useEffect } from 'react';
import { create } from 'zustand';
import { cn } from '@/lib/cn';

interface ToastState {
  message: string;
  /** Bumped on every toast so repeats re-trigger the timer. */
  seq: number;
  show: (message: string) => void;
  clear: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  message: '',
  seq: 0,
  show: (message) => set((s) => ({ message, seq: s.seq + 1 })),
  clear: () => set({ message: '' }),
}));

/** Fire a transient toast from anywhere. */
export function toast(message: string) {
  useToastStore.getState().show(message);
}

export function Toaster() {
  const { message, seq, clear } = useToastStore();

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(clear, 2200);
    return () => clearTimeout(id);
  }, [seq, message, clear]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-[22px] left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-line bg-panel2 px-[18px] py-[10px] font-semibold shadow-float transition-[0.25s]',
        message
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-5 opacity-0',
      )}
    >
      {message}
    </div>
  );
}
