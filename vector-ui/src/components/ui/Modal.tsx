import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg/80" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
        className={cn(
          'relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg border border-border2 bg-bg2 shadow-xl',
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-border2 px-4 py-3">
          <h2 id="modal-title" className="font-display text-lg text-text">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-text2 hover:bg-bg3 hover:text-text"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}
