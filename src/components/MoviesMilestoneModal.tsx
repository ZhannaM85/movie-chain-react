import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useChainContext } from '../context/ChainContext';

/** One-time celebration modal per 100-movie milestone; dismissal is persisted with the profile. */
export default function MoviesMilestoneModal() {
  const { pendingMoviesMilestoneModal, dismissMoviesMilestoneModal } = useChainContext();
  const { t } = useTranslation();

  useEffect(() => {
    if (pendingMoviesMilestoneModal == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissMoviesMilestoneModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingMoviesMilestoneModal, dismissMoviesMilestoneModal]);

  if (pendingMoviesMilestoneModal == null) return null;

  const count = pendingMoviesMilestoneModal;

  return (
    <div
      className="fixed inset-0 z-[201] flex items-end sm:items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="movies-milestone-modal-title"
      onMouseDown={(e) => e.target === e.currentTarget && dismissMoviesMilestoneModal()}
    >
      <div
        className="w-full max-w-md rounded-xl border border-indigo-400/40 dark:border-indigo-500/35 bg-white dark:bg-gray-900 shadow-xl shadow-indigo-950/40"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-3 mb-1">
            <span className="mt-0.5 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.75 1.5v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125v-9.75c0-.621.504-1.125 1.125-1.125h18.75c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125m-17.25 0h17.25"
                />
              </svg>
            </span>
            <h2 id="movies-milestone-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white pr-2">
              {t('moviesMilestoneModalTitle', { count })}
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('moviesMilestoneModalBody', { count })}
          </p>
        </div>
        <div className="px-5 py-3 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-gray-900 dark:text-white text-sm font-medium px-4 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-gray-900"
            onClick={dismissMoviesMilestoneModal}
          >
            {t('moviesMilestoneModalCta')}
          </button>
        </div>
      </div>
    </div>
  );
}
