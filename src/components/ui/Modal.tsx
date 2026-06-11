import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Rendered in the footer, right-aligned. */
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(4,7,12,0.66)] p-5 backdrop-blur-[3px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-[min(520px,100%)] overflow-auto rounded-[18px] border border-line bg-panel shadow-float"
      >
        <h2 className="m-0 border-b border-line px-[22px] py-5 text-[17px] font-semibold">
          {title}
        </h2>
        <div className="grid gap-4 px-[22px] py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-[10px] border-t border-line px-[22px] py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
