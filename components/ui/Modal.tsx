'use client';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className = '' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col ${className}`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return <Modal open={open} onClose={onClose} title={title}>{children}</Modal>;
}
