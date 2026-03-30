import { useEffect } from 'react';
import { useChainContext } from '../context/ChainContext';
import { useTranslation } from 'react-i18next';
import { achievementDesc, achievementTitle } from '../gamification/achievementLabels';

/**
 * Shows queued achievement and personal-best toasts from gamification state.
 */
export default function GamificationToasts() {
  const { gamificationToastQueue, dismissGamificationToast } = useChainContext();
  const { t } = useTranslation();

  useEffect(() => {
    if (gamificationToastQueue.length === 0) return;
    const tmr = window.setTimeout(() => dismissGamificationToast(), 5_000);
    return () => window.clearTimeout(tmr);
  }, [gamificationToastQueue, dismissGamificationToast]);

  if (gamificationToastQueue.length === 0) return null;

  const top = gamificationToastQueue[0];
  let title: string;
  let description: string;

  if (top === 'personal_best') {
    title = t('toastPersonalBest');
    description = t('toastPersonalBestDesc');
  } else if (top.startsWith('achievement:')) {
    const id = top.slice('achievement:'.length);
    title = achievementTitle(t, id);
    description = achievementDesc(t, id);
  } else {
    title = t('toastUnknownTitle');
    description = t('toastUnknownDesc');
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm w-[calc(100vw-2rem)]">
      <div
        role="status"
        className="rounded-lg border border-indigo-500/40 bg-gray-900/95 backdrop-blur px-4 py-3 shadow-lg shadow-indigo-950/50"
      >
        <p className="text-sm font-semibold text-indigo-200">{title}</p>
        {description ? <p className="text-xs text-gray-400 mt-1">{description}</p> : null}
        <button
          type="button"
          onClick={dismissGamificationToast}
          className="mt-2 text-xs text-gray-500 hover:text-gray-300"
        >
          {t('toastDismiss')}
        </button>
      </div>
    </div>
  );
}
