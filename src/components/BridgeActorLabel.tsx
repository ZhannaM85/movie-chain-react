import { useTranslation } from 'react-i18next';
import type { MovieApi } from '../services/movieApi';
import { useResolvedActorName } from '../hooks/useResolvedActorName';

type Props = {
  actorId: number;
  /** Stored on the link, or from cast inference — if missing, name is fetched by id. */
  explicitName: string | null;
  api: MovieApi;
  /** Sidebar uses smaller loading hint */
  compact?: boolean;
};

/**
 * Shows a bridge actor’s name for the active UI language (refetches by id so stored names don’t freeze a locale).
 */
export default function BridgeActorLabel({ actorId, explicitName, api, compact }: Props) {
  const { t } = useTranslation();
  const { text, loading } = useResolvedActorName(actorId, explicitName, api);

  if (loading) {
    return compact ? (
      <span className="text-[10px] text-gray-500">{t('bridgeActorNameLoading')}</span>
    ) : (
      <span className="inline-block w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
    );
  }

  return (
    <span className="truncate">{text || t('bridgeActorNameFallback', { id: actorId })}</span>
  );
}
