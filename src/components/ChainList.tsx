import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMovieApiForChain } from '../context/MovieApiContext';
import { useChainContext } from '../context/ChainContext';
import { useTranslation } from 'react-i18next';
import { buildChainRecap } from '../gamification/chainRecap';
import ChainWatchedDateField from './ChainWatchedDateField';
import ConfirmDialog from './ConfirmDialog';
import { useResolvedBridgeActors } from '../hooks/useResolvedBridgeActors';
import BridgeActorLabel from './BridgeActorLabel';
import ChainGridMovieCard from './ChainGridMovieCard';
import ChallengePointsInline from './ChallengePointsInline';
import { useResolvedMovieTitle } from '../hooks/useResolvedMovieTitle';
import type { ChainLink } from '../types/movie';
import type { MovieApi } from '../services/movieApi';

interface ChainListProps {
  /** When prepending, pick-actor / pick-movie UI is shown here (by the banner) instead of only at the top of the page. */
  prependPickPanel?: ReactNode;
}

type ChainListEntryResolved = {
  key: string;
  link: ChainLink;
  chainIndex: number;
  sequenceNumber: number;
  showBridgeRow: boolean;
  effectiveActorId: number | null;
  effectiveActorName: string | null;
  bridgePending: boolean;
  isOldestInChain: boolean;
};

function ChainListMobileRow({
  link,
  chainIndex,
  sequenceNumber,
  showBridgeRow,
  effectiveActorId,
  effectiveActorName,
  bridgePending,
  isOldestInChain,
  api,
  onRequestRemoveFirst,
}: {
  link: ChainLink;
  chainIndex: number;
  sequenceNumber: number;
  showBridgeRow: boolean;
  effectiveActorId: number | null;
  effectiveActorName: string | null;
  bridgePending: boolean;
  isOldestInChain: boolean;
  api: MovieApi;
  onRequestRemoveFirst: () => void;
}) {
  const { t } = useTranslation();
  const { title: resolvedTitle, loading: titleLoading } = useResolvedMovieTitle(
    link.movie.id,
    link.movie.title,
    api
  );

  return (
    <div>
      <div className="flex items-start gap-1.5 p-1.5 rounded-md hover:bg-gray-800/70 transition-colors group">
        <span className="text-xs text-gray-600 w-5 text-right flex-shrink-0 pt-0.5">
          {sequenceNumber}
        </span>
        {link.movie.poster_path ? (
          <Link to={`/movie/${link.movie.id}`} className="flex-shrink-0">
            <img
              src={api.posterUrl(link.movie.poster_path, 'w185')}
              alt={resolvedTitle || link.movie.title}
              className="w-8 h-12 rounded object-cover"
            />
          </Link>
        ) : (
          <Link to={`/movie/${link.movie.id}`} className="flex-shrink-0">
            <div className="w-8 h-12 rounded bg-gray-700" aria-hidden />
          </Link>
        )}
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <div className="flex items-start gap-1 min-w-0">
            <div className="min-w-0 flex-1 flex flex-col gap-0.5">
              <Link to={`/movie/${link.movie.id}`} className="min-w-0 block">
                <p className="text-sm text-gray-300 group-hover:text-white line-clamp-2 break-words">
                  {titleLoading ? (
                    <span className="text-gray-500">{t('bridgeActorNameLoading')}</span>
                  ) : (
                    resolvedTitle
                  )}
                </p>
              </Link>
              {(link.movie.release_date || link.stepDifficulty != null) && (
                <p className="text-xs text-gray-600 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  {link.movie.release_date ? (
                    <span>{new Date(link.movie.release_date).getFullYear()}</span>
                  ) : null}
                  <ChallengePointsInline points={link.stepDifficulty} className="text-gray-600" />
                </p>
              )}
            </div>
            {isOldestInChain && (
              <button
                type="button"
                onClick={onRequestRemoveFirst}
                className="shrink-0 text-[10px] text-gray-500 hover:text-red-400 transition-colors px-0.5 py-0.5"
                title={t('removeFirstFromChain')}
              >
                {t('removeFirstFromChain')}
              </button>
            )}
          </div>
          <ChainWatchedDateField
            chainIndex={chainIndex}
            idPrefix="chain-sidebar"
            labelClassName="sr-only"
            showUnsetHint={false}
            compactContentAlign="start"
            inputClassName="w-full min-w-0 max-w-[9.5rem] px-1 py-0.5 rounded bg-gray-900 border border-gray-600 text-[10px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            className="flex flex-col items-stretch gap-0.5 w-full pt-0.5"
          />
        </div>
      </div>
      {showBridgeRow && (
        <div className="flex items-center gap-1.5 py-1 pl-3 min-w-0">
          <div className="w-px h-3 bg-gray-700 shrink-0" />
          {bridgePending ? (
            <span className="text-[10px] text-gray-500 truncate">{t('bridgeActorResolving')}</span>
          ) : effectiveActorId != null ? (
            <Link
              to={`/actor/${effectiveActorId}`}
              className="text-xs text-indigo-400 hover:text-indigo-300 truncate"
            >
              <BridgeActorLabel
                actorId={effectiveActorId}
                explicitName={effectiveActorName}
                api={api}
                compact
              />
            </Link>
          ) : (
            <span className="text-xs text-indigo-400 truncate">{effectiveActorName}</span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Sidebar list that summarizes the current movie chain with quick navigation.
 *
 * @returns {JSX.Element | null} The chain list, or null if there is no chain.
 */
export default function ChainList({ prependPickPanel }: ChainListProps) {
  const api = useMovieApiForChain();
  const {
    links,
    undoLast,
    removeFirst,
    gamificationProfile,
    startPrependToChain,
    prependMode,
    cancelPrepend,
  } = useChainContext();
  const { t } = useTranslation();
  const [confirmAction, setConfirmAction] = useState<null | 'undoLast' | 'removeFirst'>(null);
  const recap = useMemo(() => buildChainRecap(links), [links]);
  const { resolved: resolvedBridges, status: bridgeResolveStatus, needsInference } =
    useResolvedBridgeActors(links, api);

  const chainEntries = useMemo((): ChainListEntryResolved[] => {
    if (links.length === 0) return [];
    return links
      .map((link, chainIndex) => ({ link, chainIndex }))
      .reverse()
      .map(({ link, chainIndex }) => {
        const hasStoredBridge =
          link.connectingActorId != null || link.connectingActorName != null;
        const inferred =
          chainIndex > 0 && !hasStoredBridge ? resolvedBridges[chainIndex] : undefined;
        const bridgePending =
          chainIndex > 0 &&
          !hasStoredBridge &&
          !(chainIndex in resolvedBridges) &&
          (bridgeResolveStatus === 'loading' ||
            (bridgeResolveStatus === 'idle' && needsInference));
        const showBridgeRow =
          chainIndex > 0 &&
          (hasStoredBridge ||
            (chainIndex in resolvedBridges && inferred != null) ||
            bridgePending);
        const effectiveActorId = hasStoredBridge
          ? link.connectingActorId ?? null
          : inferred?.id ?? null;
        const effectiveActorName = hasStoredBridge
          ? link.connectingActorName ?? null
          : inferred?.name ?? null;
        const isOldestInChain = chainIndex === 0;

        return {
          key: `${link.movie.id}-${chainIndex}`,
          link,
          chainIndex,
          sequenceNumber: links.length - chainIndex,
          showBridgeRow,
          effectiveActorId,
          effectiveActorName,
          bridgePending,
          isOldestInChain,
        };
      });
  }, [links, resolvedBridges, bridgeResolveStatus, needsInference]);

  if (links.length === 0) return null;

  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="mb-3 px-1 space-y-1.5 shrink-0">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
          <ChallengePointsInline
            points={recap.totalDifficulty}
            variant="total"
            className="text-[11px] text-gray-500"
          />
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
            type="button"
            onClick={() => setConfirmAction('undoLast')}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            {t('undo')}
          </button>
        )}
      </div>

      <div className="md:hidden space-y-1 pr-1">
        {chainEntries.map(
          ({
            key,
            link,
            chainIndex,
            sequenceNumber,
            showBridgeRow,
            effectiveActorId,
            effectiveActorName,
            bridgePending,
            isOldestInChain,
          }) => (
            <ChainListMobileRow
              key={key}
              link={link}
              chainIndex={chainIndex}
              sequenceNumber={sequenceNumber}
              showBridgeRow={showBridgeRow}
              effectiveActorId={effectiveActorId}
              effectiveActorName={effectiveActorName}
              bridgePending={bridgePending}
              isOldestInChain={isOldestInChain}
              api={api}
              onRequestRemoveFirst={() => setConfirmAction('removeFirst')}
            />
          )
        )}
      </div>

      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pr-1">
        {chainEntries.map((entry) => (
          <ChainGridMovieCard
            key={entry.key}
            link={entry.link}
            chainIndex={entry.chainIndex}
            sequenceNumber={entry.sequenceNumber}
            showBridgeRow={entry.showBridgeRow}
            effectiveActorId={entry.effectiveActorId}
            effectiveActorName={entry.effectiveActorName}
            bridgePending={entry.bridgePending}
            isOldestInChain={entry.isOldestInChain}
            onRequestRemoveOldest={() => setConfirmAction('removeFirst')}
            api={api}
          />
        ))}
        <button
          type="button"
          onClick={() => startPrependToChain()}
          className="rounded-lg border border-dashed border-gray-600 bg-gray-900/40 hover:bg-gray-800/80 hover:border-indigo-500/50 transition-colors flex flex-col items-center justify-center aspect-[2/3] min-h-[12rem] text-3xl font-medium text-indigo-400"
          title={t('addMovieBeforeChainBottom')}
          aria-label={t('addMovieBeforeChainBottom')}
        >
          +
        </button>
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
        {prependMode && prependPickPanel != null && (
          <div className="w-full min-w-0 px-1 pb-2 border-t border-gray-800/80 pt-3 mt-1">
            {prependPickPanel}
          </div>
        )}
        <div className="flex items-center gap-2 pl-1 pb-1 md:hidden">
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

      <ConfirmDialog
        open={confirmAction === 'undoLast'}
        title={t('confirmUndoLastTitle')}
        message={t('confirmUndoLastBody')}
        confirmLabel={t('confirmRemoveMovie')}
        cancelLabel={t('cancel')}
        confirmDanger
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null);
          undoLast();
        }}
      />
      <ConfirmDialog
        open={confirmAction === 'removeFirst'}
        title={t('confirmRemoveFirstTitle')}
        message={t('confirmRemoveFirstBody')}
        confirmLabel={t('confirmRemoveMovie')}
        cancelLabel={t('cancel')}
        confirmDanger
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => {
          setConfirmAction(null);
          removeFirst();
        }}
      />
    </div>
  );
}
