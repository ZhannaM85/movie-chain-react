import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMovieApiForChain } from '../context/MovieApiContext';
import { useChainContext } from '../context/ChainContext';
import { useTranslation } from 'react-i18next';
import { buildChainRecap } from '../gamification/chainRecap';
import ChainWatchedDateField from '../components/ChainWatchedDateField';
import ConfirmDialog from '../components/ConfirmDialog';
import { useResolvedBridgeActors } from '../hooks/useResolvedBridgeActors';
import BridgeActorLabel from '../components/BridgeActorLabel';
import ChallengePointsInline from '../components/ChallengePointsInline';
import MovieOverviewClamp from '../components/MovieOverviewClamp';
import { useResolvedMovieTitle } from '../hooks/useResolvedMovieTitle';
import type { MovieApi } from '../services/movieApi';
import type { ChainLink } from '../types/movie';

function ChainPageChainItem({
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
  const { t, i18n } = useTranslation();
  const { title: resolvedTitle, loading: titleLoading } = useResolvedMovieTitle(
    link.movie.id,
    link.movie.title,
    api
  );

  return (
    <div>
      <div className="rounded-xl bg-gray-800/60 border border-gray-700/50 hover:border-indigo-500/40 hover:bg-gray-800/80 transition-all overflow-hidden">
        <div className="flex items-start gap-4 p-4 group">
          <span className="text-lg font-bold text-gray-600 w-8 text-right flex-shrink-0 pt-1">
            {sequenceNumber}
          </span>
          <Link to={`/movie/${link.movie.id}`} className="flex-shrink-0">
            {link.movie.poster_path ? (
              <img
                src={api.posterUrl(link.movie.poster_path, 'w185')}
                alt={resolvedTitle || link.movie.title}
                className="w-20 sm:w-24 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 sm:w-24 aspect-[2/3] rounded-lg bg-gray-700 flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
                {t('noPoster')}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/movie/${link.movie.id}`} className="block min-w-0">
              <h3 className="text-lg font-semibold text-gray-200 group-hover:text-white break-words">
                {titleLoading ? (
                  <span className="text-gray-500">{t('bridgeActorNameLoading')}</span>
                ) : (
                  resolvedTitle
                )}
              </h3>
            </Link>
            {link.loggedDate && (
              <p className="text-sm text-emerald-400/85 mt-1">
                <time dateTime={link.loggedDate}>
                  {t('chainWatchedOn', {
                    date: new Intl.DateTimeFormat(i18n.language, {
                      dateStyle: 'long',
                    }).format(new Date(`${link.loggedDate}T12:00:00`)),
                  })}
                </time>
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400 mt-1">
              <span>
                {link.movie.release_date
                  ? new Date(link.movie.release_date).getFullYear()
                  : t('na')}
              </span>
              <ChallengePointsInline points={link.stepDifficulty} />
              {link.movie.vote_average > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {link.movie.vote_average.toFixed(1)}
                </span>
              )}
            </div>
            {link.movie.overview && (
              <div className="mt-2 min-w-0">
                <MovieOverviewClamp
                  overview={link.movie.overview}
                  className="text-sm text-gray-500"
                  resetKey={`${link.movie.id}-${chainIndex}`}
                  linkTo={`/movie/${link.movie.id}`}
                />
              </div>
            )}
            {link.comment && (
              <div className="mt-2 text-sm text-indigo-300/80 italic">
                &ldquo;{link.comment}&rdquo;
              </div>
            )}
          </div>
        </div>
        <div className="px-4 pb-4 pt-2 border-t border-gray-700/40 bg-gray-900/15">
          <ChainWatchedDateField
            chainIndex={chainIndex}
            idPrefix="chain-page"
            showRemoveFirstButton={isOldestInChain}
            onRemoveFirst={onRequestRemoveFirst}
          />
        </div>
      </div>
      {showBridgeRow && (
        <div className="flex items-center gap-3 py-3 pl-6 min-w-0">
          <div className="w-px h-6 bg-indigo-500/40 shrink-0" />
          {bridgePending ? (
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              {t('bridgeActorResolving')}
            </span>
          ) : (
            <Link
              to={effectiveActorId != null ? `/actor/${effectiveActorId}` : '#'}
              className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors min-w-0"
            >
              {effectiveActorId != null && <ActorAvatar actorId={effectiveActorId} api={api} />}
              {effectiveActorId != null && (
                <BridgeActorLabel
                  actorId={effectiveActorId}
                  explicitName={effectiveActorName}
                  api={api}
                />
              )}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Dedicated page that visualizes the full movie chain with connecting actors.
 *
 * @returns {JSX.Element} The chain overview page.
 */
export default function ChainPage() {
  const api = useMovieApiForChain();
  const navigate = useNavigate();
  const { links, resetChain, undoLast, removeFirst, gamificationProfile, startPrependToChain } =
    useChainContext();
  const { t } = useTranslation();
  const [confirmAction, setConfirmAction] = useState<null | 'undoLast' | 'removeFirst'>(null);
  const recap = useMemo(() => buildChainRecap(links), [links]);
  const { resolved: resolvedBridges, status: bridgeResolveStatus, needsInference } =
    useResolvedBridgeActors(links, api);

  if (links.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white mb-3">{t('noChainYet')}</h1>
        <p className="text-gray-400 mb-6">{t('noChainDescription')}</p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
        >
          {t('startChain')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/" className="text-sm text-indigo-400 hover:text-indigo-300 mb-2 inline-block">
            &larr; {t('backToChain')}
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {t('yourMovieChain')}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {t('linkedMovies', { count: links.length })}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
            <span>
              {t('challengePointsLabel')}:{' '}
              <span className="text-indigo-300/90 font-medium">{recap.totalDifficulty}</span>
            </span>
            <span>
              {t('bestChainLabel')}:{' '}
              <span className="text-gray-300">{gamificationProfile.longestChainEver}</span>
            </span>
            {recap.distinctDecades >= 2 && (
              <span>
                {t('decadesSpanned')}: {recap.distinctDecades}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {links.length > 1 && (
            <button
              type="button"
              onClick={() => setConfirmAction('undoLast')}
              className="text-sm px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              {t('undoLast')}
            </button>
          )}
          <button
            onClick={() => {
              const msg = t('confirmNewChainRecap', {
                length: recap.length,
                difficulty: recap.totalDifficulty,
                actors: recap.uniqueActors,
                decades: recap.distinctDecades,
              });
              if (window.confirm(msg)) {
                resetChain();
              }
            }}
            className="text-sm px-3 py-1.5 rounded-md bg-gray-800 hover:bg-red-900/50 hover:text-red-300 text-gray-300 transition-colors"
          >
            {t('newChain')}
          </button>
        </div>
      </div>

      <div className="space-y-0">
        {links
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
            /** Forward index 0 = oldest link; reversed list shows it at the bottom. */
            const isOldestInChain = chainIndex === 0;

            return (
              <ChainPageChainItem
                key={`${link.movie.id}-${chainIndex}`}
                link={link}
                chainIndex={chainIndex}
                sequenceNumber={links.length - chainIndex}
                showBridgeRow={showBridgeRow}
                effectiveActorId={effectiveActorId}
                effectiveActorName={effectiveActorName}
                bridgePending={bridgePending}
                isOldestInChain={isOldestInChain}
                api={api}
                onRequestRemoveFirst={() => setConfirmAction('removeFirst')}
              />
            );
          })}
        <div className="mt-4 flex items-center">
          <button
            type="button"
            onClick={() => {
              startPrependToChain();
              navigate('/');
            }}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-dashed border-gray-600 text-xl font-medium text-indigo-400 hover:bg-gray-800/80 hover:border-indigo-500/50 transition-colors"
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

/**
 * Small circular avatar for a connecting actor in the chain.
 *
 * @param {{ actorId: number }} props - The actor identifier whose avatar should be shown.
 * @returns {JSX.Element} The avatar image or a placeholder icon.
 */
function ActorAvatar({ actorId, api }: { actorId: number; api: import('../services/movieApi').MovieApi }) {
  const { i18n } = useTranslation();
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    api
      .getActorDetails(actorId)
      .then((actor) => {
        if (!ignore && actor.profile_path) {
          setImgSrc(api.profileUrl(actor.profile_path));
        }
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, [actorId, api, i18n.resolvedLanguage, i18n.language]);

  if (!imgSrc) {
    return (
      <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      </div>
    );
  }

  return (
    <img src={imgSrc} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
  );
}
