import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMovieApiForChain } from '../context/MovieApiContext';
import { useChainContext } from '../context/ChainContext';
import { useTranslation } from 'react-i18next';
import { buildChainRecap } from '../gamification/chainRecap';
import ChainWatchedDateField from './ChainWatchedDateField';

interface ChainListProps {
  /**
   * Actor / movie pick UI when prepending or picking the next step (e.g. mobile home).
   * Chain entries scroll; prepend banner and “+” sit in a fixed footer at the bottom.
   */
  pickStepPanel?: ReactNode;
}

/**
 * Sidebar list that summarizes the current movie chain with quick navigation.
 *
 * @returns {JSX.Element | null} The chain list, or null if there is no chain.
 */
export default function ChainList({ pickStepPanel }: ChainListProps) {
  const api = useMovieApiForChain();
  const { links, undoLast, gamificationProfile, startPrependToChain, prependMode, cancelPrepend } =
    useChainContext();
  const { t } = useTranslation();
  const recap = useMemo(() => buildChainRecap(links), [links]);

  if (links.length === 0) return null;

  return (
    <div className="flex flex-col min-h-0 flex-1 h-full max-h-full overflow-hidden">
      <div className="mb-3 px-1 space-y-1.5 shrink-0">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
          <span title={t('challengePointsTooltip')}>
            {t('challengePointsShort', { points: recap.totalDifficulty })}
          </span>
          <span title={t('bestChainTooltip')}>
            {t('bestChainShort', { count: gamificationProfile.longestChainEver })}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between mb-3 px-1 shrink-0">
        <Link
          to="/chain"
          className="text-sm font-semibold text-gray-400 uppercase tracking-wider hover:text-indigo-400 transition-colors"
        >
          {t('chain')}
        </Link>
        {links.length > 1 && (
          <button
            onClick={undoLast}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            {t('undo')}
          </button>
        )}
      </div>

      {pickStepPanel != null && (
        <div className="mb-3 max-h-[min(45vh,22rem)] min-h-0 shrink-0 overflow-y-auto border-b border-gray-800 px-1 pb-3">
          {pickStepPanel}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
        {links
          .map((link, chainIndex) => ({ link, chainIndex }))
          .reverse()
          .map(({ link, chainIndex }) => (
          <div key={`${link.movie.id}-${chainIndex}`}>
            {chainIndex > 0 && link.connectingActorName && (
              <div className="flex items-center gap-1.5 py-1 pl-3">
                <div className="w-px h-3 bg-gray-700" />
                <span className="text-xs text-indigo-400">{link.connectingActorName}</span>
              </div>
            )}
            <div className="flex items-start gap-1.5 p-1.5 rounded-md hover:bg-gray-800/70 transition-colors group">
              <Link
                to={`/movie/${link.movie.id}`}
                className="flex items-center gap-2 min-w-0 flex-1"
              >
                <span className="text-xs text-gray-600 w-5 text-right flex-shrink-0">
                  {links.length - chainIndex}
                </span>
                {link.movie.poster_path ? (
                  <img
                    src={api.posterUrl(link.movie.poster_path, 'w185')}
                    alt={link.movie.title}
                    className="w-8 h-12 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-12 rounded bg-gray-700 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm text-gray-300 group-hover:text-white truncate">
                    {link.movie.title}
                  </p>
                  <p className="text-xs text-gray-600">
                    {link.movie.release_date ? new Date(link.movie.release_date).getFullYear() : ''}
                  </p>
                </div>
              </Link>
              <div className="shrink-0 pt-0.5 max-w-[40%] sm:max-w-none">
                <ChainWatchedDateField
                  chainIndex={chainIndex}
                  idPrefix="chain-sidebar"
                  labelClassName="sr-only"
                  showUnsetHint={false}
                  inputClassName="w-full min-w-0 max-w-[9.5rem] px-1 py-0.5 rounded bg-gray-900 border border-gray-600 text-[10px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  className="flex flex-col items-stretch gap-0.5"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 flex flex-col gap-2 pt-2 mt-1 border-t border-gray-800/70 px-1">
        {prependMode && (
          <div className="rounded-lg border border-indigo-500/40 bg-indigo-950/30 px-3 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-indigo-200/90">{t('prependToChainBanner')}</p>
            <button
              type="button"
              onClick={() => cancelPrepend()}
              className="text-sm shrink-0 px-3 py-1.5 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors self-start sm:self-auto"
            >
              {t('cancel')}
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 pl-1 pb-1">
          <button
            type="button"
            onClick={() => startPrependToChain()}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-dashed border-gray-600 text-lg font-medium text-indigo-400 hover:bg-gray-800/80 hover:border-indigo-500/50 transition-colors"
            title={t('addMovieBeforeChainBottom')}
            aria-label={t('addMovieBeforeChainBottom')}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
