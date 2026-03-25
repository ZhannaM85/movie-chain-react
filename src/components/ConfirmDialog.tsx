import { useEffect } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Use danger styling for the confirm button (e.g. remove actions). */
  confirmDanger?: boolean;
}

/**
 * Accessible confirmation modal (backdrop, Escape, focus containment via single focusable actions).
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmDanger = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-4 border-b border-gray-800">
          <h2 id="confirm-dialog-title" className="text-lg font-semibold text-white">
            {title}
          </h2>
          <p id="confirm-dialog-desc" className="text-sm text-gray-400 mt-2">
            {message}
          </p>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 py-3">
          <button
            type="button"
            className="w-full sm:w-auto text-sm px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800/80 transition-colors"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              confirmDanger
                ? 'w-full sm:w-auto text-sm px-4 py-2 rounded-lg bg-red-900/80 hover:bg-red-800 text-red-100 transition-colors'
                : 'w-full sm:w-auto text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors'
            }
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
