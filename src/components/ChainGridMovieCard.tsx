import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ChainLink } from '../types/movie';
import type { MovieApi } from '../services/movieApi';
import ChainWatchedDateField from './ChainWatchedDateField';
import BridgeActorLabel from './BridgeActorLabel';
import ChallengePointsInline from './ChallengePointsInline';
import { useResolvedMovieTitle } from '../hooks/useResolvedMovieTitle';

export interface ChainGridMovieCardProps {
  link: ChainLink;
  chainIndex: number;
  sequenceNumber: number;
  showBridgeRow: boolean;
  effectiveActorId: number | null;
  effectiveActorName: string | null;
  bridgePending: boolean;
  isOldestInChain: boolean;
  onRequestRemoveOldest: () => void;
  api: MovieApi;
}

/**
 * Desktop grid cell: poster + details in the same visual language as {@link ActorCard}.
 */
export default function ChainGridMovieCard({
  link,
  chainIndex,
  sequenceNumber,
  showBridgeRow,
  effectiveActorId,
  effectiveActorName,
  bridgePending,
  isOldestInChain,
  onRequestRemoveOldest,
  api,
}: ChainGridMovieCardProps) {
  const { t } = useTranslation();
  const movie = link.movie;
  const { title: resolvedTitle, loading: titleLoading } = useResolvedMovieTitle(
    movie.id,
    movie.title,
    api
  );
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : '';

  return (
    <article className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100/80 dark:bg-gray-800/50 hover:border-indigo-500/60 dark:hover:border-indigo-500/40 hover:bg-gray-100/90 dark:bg-gray-800/80 transition-all text-left flex flex-col min-w-0 h-full">
      <Link to={`/movie/${movie.id}`} className="block shrink-0 relative group">
        {movie.poster_path ? (
          <img
            src={api.posterUrl(movie.poster_path, 'w342')}
            alt={resolvedTitle || movie.title}
            className="w-full aspect-[2/3] object-cover"
          />
        ) : (
          <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-xs">
            {t('noPoster')}
          </div>
        )}
        <span className="absolute top-2 left-2 rounded bg-gray-50 dark:bg-gray-950/85 px-1.5 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
          {sequenceNumber}
        </span>
      </Link>

      <div className="p-2.5 flex flex-col gap-1.5 flex-1 min-h-0">
        {showBridgeRow && (
          <div className="flex items-center gap-1.5 min-w-0 pb-1 border-b border-gray-300/80 dark:border-gray-700/80">
            <div className="w-px h-3 bg-gray-600 shrink-0" />
            {bridgePending ? (
              <span className="text-[11px] text-gray-500 truncate">{t('bridgeActorResolving')}</span>
            ) : effectiveActorId != null ? (
              <Link
                to={`/actor/${effectiveActorId}`}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 truncate min-w-0"
              >
                <BridgeActorLabel
                  actorId={effectiveActorId}
                  explicitName={effectiveActorName}
                  api={api}
                  compact
                />
              </Link>
            ) : (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 truncate">{effectiveActorName}</span>
            )}
          </div>
        )}

        <div className="min-w-0">
          <Link
            to={`/movie/${movie.id}`}
            className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:text-white line-clamp-2 break-words"
          >
            {titleLoading ? (
              <span className="text-gray-500">{t('bridgeActorNameLoading')}</span>
            ) : (
              resolvedTitle
            )}
          </Link>
          {(year !== '' || link.stepDifficulty != null) && (
            <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {year !== '' && <span>{year}</span>}
              <ChallengePointsInline points={link.stepDifficulty} className="text-gray-500" />
            </p>
          )}
        </div>

        <ChainWatchedDateField
          chainIndex={chainIndex}
          idPrefix="chain-grid"
          labelClassName="sr-only"
          showUnsetHint={false}
          compactContentAlign="start"
          inputClassName="w-full min-w-0 px-1.5 py-1 rounded-md bg-white dark:bg-gray-900 border border-gray-400 dark:border-gray-600 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          className="flex flex-col items-stretch gap-1 w-full pt-0.5"
        />

        {isOldestInChain && (
          <button
            type="button"
            onClick={onRequestRemoveOldest}
            className="mt-auto pt-1 text-[11px] text-gray-500 hover:text-red-600 dark:text-red-400 transition-colors text-left"
          >
            {t('removeFirstFromChain')}
          </button>
        )}
      </div>
    </article>
  );
}
