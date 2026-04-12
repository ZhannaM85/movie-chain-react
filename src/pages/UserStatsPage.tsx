import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useChainContext } from '../context/ChainContext';
import { useMovieApiForChain } from '../context/MovieApiContext';
import ActivityHeatmap from '../components/ActivityHeatmap';
import {
  getTopActorBridges,
  fetchTopCastAppearancesFromApi,
  type ActorBridgeRank,
} from '../gamification/actorStats';
import { achievementDesc, achievementTitle } from '../gamification/achievementLabels';
import { ACHIEVEMENT_IDS } from '../gamification/types';
import { useTranslation } from 'react-i18next';
import { useMatchMedia } from '../hooks/useMatchMedia';
import {
  mergeMoviesAddedByDateByStrikeWithChainLinks,
  totalPerDateFromByStrike,
} from '../gamification/heatmap';
import { useResolvedActorName } from '../hooks/useResolvedActorName';
import { useChainUiPreferences } from '../hooks/useChainUiPreferences';
import type { MovieApi } from '../services/movieApi';

/** Temporary: bridge leaderboard hidden (one bridge per actor rule); set true to show again. */
const SHOW_TOP_BRIDGE_ACTORS = false;

const TOP_CAST_LIMIT = SHOW_TOP_BRIDGE_ACTORS ? 12 : 24;

/**
 * Local “profile” stats: activity heatmap, streaks, top bridge actors, totals.
 */
/** Resolves the label via person id + current UI locale (see BridgeActorLabel). */
function StatsActorDisplayName({
  actorIdStr,
  fallbackName,
  api,
}: {
  actorIdStr: string;
  fallbackName: string;
  api: MovieApi;
}) {
  const { t } = useTranslation();
  const idNum = Number(actorIdStr);
  const actorId = Number.isFinite(idNum) && idNum > 0 ? idNum : null;
  const { text, loading } = useResolvedActorName(actorId, fallbackName, api);

  if (actorId == null) {
    return <span className="truncate">{fallbackName}</span>;
  }
  if (loading) {
    return <span className="text-gray-500 truncate">{t('bridgeActorNameLoading')}</span>;
  }
  return <span className="truncate">{text || t('bridgeActorNameFallback', { id: actorId })}</span>;
}

export default function UserStatsPage() {
  const { gamificationProfile: p, links } = useChainContext();
  const api = useMovieApiForChain();
  const { t } = useTranslation();
  /** No reliable hover tooltip (touch or narrow layout); blocked switches stay clickable to show a toast. */
  const prefersCoarsePointer = useMatchMedia('(hover: none) and (pointer: coarse)');
  const isNarrowViewport = useMatchMedia('(max-width: 767px)');
  const isTouchPrimaryUi = prefersCoarsePointer || isNarrowViewport;
  const [pickModeBlockedHint, setPickModeBlockedHint] = useState<string | null>(null);

  useEffect(() => {
    if (pickModeBlockedHint == null) return;
    const timer = window.setTimeout(() => setPickModeBlockedHint(null), 5_000);
    return () => window.clearTimeout(timer);
  }, [pickModeBlockedHint]);

  const {
    strictListOrderActors,
    strictListOrderMovies,
    randomSinglePickActors,
    randomSinglePickMovies,
    randomSinglePickLimitToTop12,
    setStrictListOrderActors,
    setStrictListOrderMovies,
    setRandomSinglePickActors,
    setRandomSinglePickMovies,
    setRandomSinglePickLimitToTop12,
  } = useChainUiPreferences();

  const chainMovieIdsKey = useMemo(() => links.map((l) => l.movie.id).join(','), [links]);

  const randomSinglePickAnyOn = randomSinglePickActors || randomSinglePickMovies;

  const [topCastActors, setTopCastActors] = useState<ActorBridgeRank[]>([]);
  const [topCastLoading, setTopCastLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (links.length === 0) {
      setTopCastActors([]);
      setTopCastLoading(false);
      return;
    }
    setTopCastLoading(true);
    fetchTopCastAppearancesFromApi(links, api, TOP_CAST_LIMIT)
      .then((rows) => {
        if (!cancelled) setTopCastActors(rows);
      })
      .finally(() => {
        if (!cancelled) setTopCastLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, chainMovieIdsKey]);

  const heatmapByStrike = useMemo(
    () => mergeMoviesAddedByDateByStrikeWithChainLinks(p.moviesAddedByDateByStrike, links),
    [p.moviesAddedByDateByStrike, links]
  );

  const heatmapTotals = useMemo(() => totalPerDateFromByStrike(heatmapByStrike), [heatmapByStrike]);

  const topActors = useMemo(
    () => (SHOW_TOP_BRIDGE_ACTORS ? getTopActorBridges(p, 12) : []),
    [p]
  );

  const busiestDay = useMemo(() => {
    let bestDate: string | null = null;
    let bestCount = 0;
    for (const [date, count] of Object.entries(heatmapTotals)) {
      if (count > bestCount) {
        bestCount = count;
        bestDate = date;
      }
    }
    return bestDate && bestCount > 0 ? { date: bestDate, count: bestCount } : null;
  }, [heatmapTotals]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('userStatsTitle')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('userStatsSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10 overflow-visible">
        <StatCard label={t('statTotalMoviesLogged')} value={String(p.totalLinksAddedAllTime)} explanation={t('statExplainTotalMovies')} />
        <StatCard
          label={t('statChallengePointsTotal')}
          value={String(p.totalChallengePointsAllTime)}
          explanation={t('statExplainChallengePoints')}
        />
        <StatCard
          label={t('statLongestStreak')}
          value={String(p.longestStreakEver)}
          hint={t('statDaysUtc')}
          explanation={t('statExplainLongestStreak')}
        />
        <StatCard
          label={t('statCurrentStreak')}
          value={String(p.currentStreak)}
          hint={t('statDaysUtc')}
          explanation={t('statExplainCurrentStreak')}
        />
      </div>

      <section
        className="mb-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4"
        aria-labelledby="strict-list-order-heading"
      >
        <h2
          id="strict-list-order-heading"
          className="text-sm font-semibold text-gray-900 dark:text-white mb-1"
        >
          {t('strictListOrderSectionTitle')}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-snug">
          {t('strictListOrderSectionIntro')}
        </p>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0" id="strict-list-order-cast-desc">
              <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                {t('strictListOrderCastLabel')}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">{t('strictListOrderCastHint')}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={strictListOrderActors}
              aria-disabled={randomSinglePickActors}
              aria-labelledby="strict-list-order-heading"
              aria-describedby="strict-list-order-cast-desc"
              disabled={randomSinglePickActors && !isTouchPrimaryUi}
              title={
                randomSinglePickActors ? t('strictCastSwitchDisabledWhileRandomOn') : undefined
              }
              onClick={() => {
                if (randomSinglePickActors) {
                  if (isTouchPrimaryUi) {
                    setPickModeBlockedHint(t('strictCastSwitchDisabledWhileRandomOn'));
                  }
                  return;
                }
                setStrictListOrderActors(!strictListOrderActors);
              }}
              className={
                'relative shrink-0 h-7 w-12 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-45 disabled:cursor-not-allowed ' +
                (randomSinglePickActors && isTouchPrimaryUi ? 'opacity-45 cursor-not-allowed ' : '') +
                (strictListOrderActors
                  ? 'bg-indigo-600 dark:bg-indigo-500'
                  : 'bg-gray-300 dark:bg-gray-600')
              }
            >
              <span
                className={
                  'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ' +
                  (strictListOrderActors ? 'translate-x-5' : 'translate-x-0')
                }
              />
            </button>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0" id="strict-list-order-movies-desc">
              <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                {t('strictListOrderFilmographyLabel')}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                {t('strictListOrderFilmographyHint')}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={strictListOrderMovies}
              aria-disabled={randomSinglePickMovies}
              aria-labelledby="strict-list-order-heading"
              aria-describedby="strict-list-order-movies-desc"
              disabled={randomSinglePickMovies && !isTouchPrimaryUi}
              title={
                randomSinglePickMovies ? t('strictFilmographySwitchDisabledWhileRandomOn') : undefined
              }
              onClick={() => {
                if (randomSinglePickMovies) {
                  if (isTouchPrimaryUi) {
                    setPickModeBlockedHint(t('strictFilmographySwitchDisabledWhileRandomOn'));
                  }
                  return;
                }
                setStrictListOrderMovies(!strictListOrderMovies);
              }}
              className={
                'relative shrink-0 h-7 w-12 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-45 disabled:cursor-not-allowed ' +
                (randomSinglePickMovies && isTouchPrimaryUi ? 'opacity-45 cursor-not-allowed ' : '') +
                (strictListOrderMovies
                  ? 'bg-indigo-600 dark:bg-indigo-500'
                  : 'bg-gray-300 dark:bg-gray-600')
              }
            >
              <span
                className={
                  'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ' +
                  (strictListOrderMovies ? 'translate-x-5' : 'translate-x-0')
                }
              />
            </button>
          </div>
        </div>
      </section>

      <section
        className="mb-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-4"
        aria-labelledby="random-single-pick-heading"
      >
        <h2
          id="random-single-pick-heading"
          className="text-sm font-semibold text-gray-900 dark:text-white mb-1"
        >
          {t('randomSinglePickSectionTitle')}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-snug">
          {t('randomSinglePickSectionIntro')}
        </p>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0" id="random-single-pick-cast-desc">
              <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                {t('randomSinglePickCastLabel')}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">{t('randomSinglePickCastHint')}</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={randomSinglePickActors}
              aria-disabled={strictListOrderActors}
              aria-labelledby="random-single-pick-heading"
              aria-describedby="random-single-pick-cast-desc"
              disabled={strictListOrderActors && !isTouchPrimaryUi}
              title={
                strictListOrderActors ? t('randomCastSwitchDisabledWhileStrictOn') : undefined
              }
              onClick={() => {
                if (strictListOrderActors) {
                  if (isTouchPrimaryUi) {
                    setPickModeBlockedHint(t('randomCastSwitchDisabledWhileStrictOn'));
                  }
                  return;
                }
                setRandomSinglePickActors(!randomSinglePickActors);
              }}
              className={
                'relative shrink-0 h-7 w-12 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-45 disabled:cursor-not-allowed ' +
                (strictListOrderActors && isTouchPrimaryUi ? 'opacity-45 cursor-not-allowed ' : '') +
                (randomSinglePickActors
                  ? 'bg-indigo-600 dark:bg-indigo-500'
                  : 'bg-gray-300 dark:bg-gray-600')
              }
            >
              <span
                className={
                  'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ' +
                  (randomSinglePickActors ? 'translate-x-5' : 'translate-x-0')
                }
              />
            </button>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0" id="random-single-pick-movies-desc">
              <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                {t('randomSinglePickFilmographyLabel')}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                {t('randomSinglePickFilmographyHint')}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={randomSinglePickMovies}
              aria-disabled={strictListOrderMovies}
              aria-labelledby="random-single-pick-heading"
              aria-describedby="random-single-pick-movies-desc"
              disabled={strictListOrderMovies && !isTouchPrimaryUi}
              title={
                strictListOrderMovies ? t('randomFilmographySwitchDisabledWhileStrictOn') : undefined
              }
              onClick={() => {
                if (strictListOrderMovies) {
                  if (isTouchPrimaryUi) {
                    setPickModeBlockedHint(t('randomFilmographySwitchDisabledWhileStrictOn'));
                  }
                  return;
                }
                setRandomSinglePickMovies(!randomSinglePickMovies);
              }}
              className={
                'relative shrink-0 h-7 w-12 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-45 disabled:cursor-not-allowed ' +
                (strictListOrderMovies && isTouchPrimaryUi ? 'opacity-45 cursor-not-allowed ' : '') +
                (randomSinglePickMovies
                  ? 'bg-indigo-600 dark:bg-indigo-500'
                  : 'bg-gray-300 dark:bg-gray-600')
              }
            >
              <span
                className={
                  'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ' +
                  (randomSinglePickMovies ? 'translate-x-5' : 'translate-x-0')
                }
              />
            </button>
          </div>
          <div className="flex items-start justify-between gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <div className="min-w-0" id="random-single-pick-limit-desc">
              <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                {t('randomSinglePickLimitPoolLabel')}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                {t('randomSinglePickLimitPoolHint')}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={randomSinglePickLimitToTop12}
              aria-disabled={!randomSinglePickAnyOn}
              aria-labelledby="random-single-pick-heading"
              aria-describedby="random-single-pick-limit-desc"
              disabled={!randomSinglePickAnyOn && !isTouchPrimaryUi}
              title={
                !randomSinglePickAnyOn ? t('randomLimitPoolSwitchDisabledNoRandomOn') : undefined
              }
              onClick={() => {
                if (!randomSinglePickAnyOn) {
                  if (isTouchPrimaryUi) {
                    setPickModeBlockedHint(t('randomLimitPoolSwitchDisabledNoRandomOn'));
                  }
                  return;
                }
                setRandomSinglePickLimitToTop12(!randomSinglePickLimitToTop12);
              }}
              className={
                'relative shrink-0 h-7 w-12 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 disabled:opacity-45 disabled:cursor-not-allowed ' +
                (!randomSinglePickAnyOn && isTouchPrimaryUi ? 'opacity-45 cursor-not-allowed ' : '') +
                (randomSinglePickLimitToTop12
                  ? 'bg-indigo-600 dark:bg-indigo-500'
                  : 'bg-gray-300 dark:bg-gray-600')
              }
            >
              <span
                className={
                  'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ' +
                  (randomSinglePickLimitToTop12 ? 'translate-x-5' : 'translate-x-0')
                }
              />
            </button>
          </div>
        </div>
      </section>

      <div className="mb-10 overflow-visible">
        <ExplainableSectionTitle title={t('heatmapSectionTitle')} explanation={t('heatmapSectionExplain')} />
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100/80 dark:bg-gray-900/40 p-4">
          <ActivityHeatmap moviesAddedByDateByStrike={heatmapByStrike} />
        </div>
        {busiestDay && (
          <ExplainableHint
            className="text-xs text-gray-500 mt-3"
            explanation={t('statExplainBusiestDay')}
          >
            {t('statBusiestDay', { date: busiestDay.date, count: busiestDay.count })}
          </ExplainableHint>
        )}
      </div>

      <div
        className={
          SHOW_TOP_BRIDGE_ACTORS
            ? 'grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-visible'
            : 'grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-visible'
        }
      >
        {SHOW_TOP_BRIDGE_ACTORS ? (
          <section>
            <ExplainableSectionTitle title={t('topActorsSectionTitle')} explanation={t('statExplainTopBridge')} />
            {topActors.length === 0 ? (
              <p className="text-sm text-gray-600">{t('topActorsEmpty')}</p>
            ) : (
              <ul className="space-y-2">
                {topActors.map((a, i) => (
                  <li key={a.id}>
                    <Link
                      to={`/actor/${a.id}?from=bridge`}
                      className="group flex items-center justify-between gap-3 rounded-lg bg-gray-100/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 px-3 py-2 w-full min-w-0 text-left no-underline hover:border-indigo-600/50 dark:hover:border-indigo-500/50 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs text-gray-600 w-5 flex-shrink-0">{i + 1}</span>
                        <span className="text-sm text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:hover:text-indigo-300 truncate">
                          <StatsActorDisplayName actorIdStr={a.id} fallbackName={a.name} api={api} />
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0 tabular-nums">
                        {t('actorBridgeTimes', { count: a.count })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        <section>
          <div className="mb-1">
            <ExplainableSectionTitle title={t('topCastSectionTitle')} explanation={t('statExplainTopCast')} />
          </div>
          <p className="text-xs text-gray-600 mb-3">{t('topCastSectionHint')}</p>
          {topCastLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
              <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              {t('statsTopCastLoading')}
            </div>
          ) : topCastActors.length === 0 ? (
            <p className="text-sm text-gray-600">{t('topCastEmpty')}</p>
          ) : (
            <ul className="space-y-2">
              {topCastActors.map((a, i) => (
                <li key={a.id}>
                  <Link
                    to={`/actor/${a.id}?from=cast`}
                    className="group flex items-center justify-between gap-3 rounded-lg bg-gray-100/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 px-3 py-2 w-full min-w-0 text-left no-underline hover:border-indigo-600/50 dark:hover:border-indigo-500/50 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs text-gray-600 w-5 flex-shrink-0">{i + 1}</span>
                      <span className="text-sm text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:hover:text-indigo-300 truncate">
                        <StatsActorDisplayName actorIdStr={a.id} fallbackName={a.name} api={api} />
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 tabular-nums">
                      {t('actorCastMovies', { count: a.count })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">
            {t('moreStatsSectionTitle')}
          </h2>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <ExplainableRow
              label={t('statLongestChain')}
              value={<span className="text-gray-800 dark:text-gray-200 tabular-nums">{p.longestChainEver}</span>}
              explanation={t('statExplainMoreLongestChain')}
            />
            <AchievementsUnlockedRow
              count={p.unlockedAchievementIds.length}
              unlockedIds={p.unlockedAchievementIds}
              explanation={t('statExplainMoreAchievements')}
            />
            <ExplainableRow
              label={t('statFirstNoteWritten')}
              value={<span className="text-gray-800 dark:text-gray-200">{p.hasWrittenNoteBefore ? t('yes') : t('no')}</span>}
              explanation={t('statExplainMoreFirstNote')}
            />
          </ul>
        </section>
      </div>

      {pickModeBlockedHint != null ? (
        <div className="fixed bottom-4 left-4 right-4 z-[100] sm:left-auto sm:right-4 sm:max-w-md w-auto pointer-events-none flex justify-center sm:justify-end">
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-auto rounded-lg border border-amber-500/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-4 py-3 shadow-lg shadow-amber-950/20 max-w-full"
          >
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{pickModeBlockedHint}</p>
            <button
              type="button"
              onClick={() => setPickModeBlockedHint(null)}
              className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {t('toastDismiss')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AchievementLockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function UnlockedAchievementsModal({
  unlockedIds,
  explanation,
  onClose,
}: {
  unlockedIds: string[];
  explanation: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const unlockedSet = useMemo(() => new Set(unlockedIds), [unlockedIds]);
  const extraUnlockedIds = useMemo(
    () => unlockedIds.filter((id) => !(ACHIEVEMENT_IDS as readonly string[]).includes(id)),
    [unlockedIds]
  );
  const unlockedDefined = useMemo(
    () => ACHIEVEMENT_IDS.filter((id) => unlockedSet.has(id)),
    [unlockedSet]
  );
  const lockedDefined = useMemo(
    () => ACHIEVEMENT_IDS.filter((id) => !unlockedSet.has(id)),
    [unlockedSet]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievements-modal-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl max-h-[85vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <h2 id="achievements-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white pr-2">
            {t('statAchievementsModalTitle')}
          </h2>
          <button
            type="button"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 shrink-0 rounded-lg hover:bg-gray-100/90 dark:bg-gray-800/80"
            onClick={onClose}
          >
            {t('statAchievementsModalClose')}
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3 flex-1 min-h-0 space-y-6">
          <section aria-labelledby="achievements-unlocked-heading">
            <h3
              id="achievements-unlocked-heading"
              className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500/90 mb-2"
            >
              {t('achievementSectionUnlocked')}
            </h3>
            {unlockedDefined.length === 0 && extraUnlockedIds.length === 0 ? (
              <p className="text-sm text-gray-500 py-1">{t('achievementSectionUnlockedEmpty')}</p>
            ) : (
              <ul className="space-y-2">
                {unlockedDefined.map((id) => (
                  <li
                    key={id}
                    className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-3 py-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400/90 mt-0.5 shrink-0" aria-hidden>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {achievementTitle(t, id)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {achievementDesc(t, id)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
                {extraUnlockedIds.map((id) => (
                  <li
                    key={id}
                    className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {achievementTitle(t, id)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {achievementDesc(t, id)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="achievements-locked-heading">
            <h3
              id="achievements-locked-heading"
              className="text-[11px] font-semibold uppercase tracking-wider text-amber-600/90 mb-2"
            >
              {t('achievementSectionLocked')}
            </h3>
            {lockedDefined.length === 0 ? (
              <p className="text-sm text-gray-500 py-1">{t('achievementSectionLockedEmpty')}</p>
            ) : (
              <ul className="space-y-2">
                {lockedDefined.map((id) => (
                  <li
                    key={id}
                    className="rounded-lg border border-dashed border-amber-900/40 bg-gray-50 dark:bg-gray-950/80 px-3 py-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <AchievementLockIcon className="w-4 h-4 text-amber-600/80 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{achievementTitle(t, id)}</p>
                          <span className="text-[10px] font-medium uppercase tracking-wide text-amber-600/90 shrink-0">
                            {t('achievementLocked')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{achievementDesc(t, id)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-xs text-gray-600 pt-2 border-t border-gray-200 dark:border-gray-800 leading-relaxed">{explanation}</p>
        </div>
      </div>
    </div>
  );
}

function AchievementsUnlockedRow({
  count,
  unlockedIds,
  explanation,
}: {
  count: number;
  unlockedIds: string[];
  explanation: string;
}) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <li className="border-b border-gray-200/80 dark:border-gray-800/80 pb-2 last:border-0 overflow-visible">
      <button
        type="button"
        className="w-full flex justify-between gap-4 items-start text-left rounded-lg -mx-1 px-1 py-0.5 hover:bg-gray-100/80 dark:bg-gray-800/50 border border-transparent hover:border-gray-200/80 dark:border-gray-700/40 transition-colors cursor-pointer group"
        onClick={() => setModalOpen(true)}
        aria-expanded={modalOpen}
        aria-haspopup="dialog"
      >
        <span className="text-gray-600 dark:text-gray-400 group-hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          {t('statAchievementsUnlocked')}
        </span>
        <span className="shrink-0 text-right text-gray-800 dark:text-gray-200 tabular-nums group-hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          {count}
        </span>
      </button>
      {modalOpen ? (
        <UnlockedAchievementsModal
          unlockedIds={unlockedIds}
          explanation={explanation}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </li>
  );
}

function StatCard({
  label,
  value,
  hint,
  explanation,
}: {
  label: string;
  value: string;
  hint?: string;
  explanation?: string;
}) {
  const narrow = useMatchMedia('(max-width: 767px)');
  const [open, setOpen] = useState(false);

  return (
    <div
      className={
        'relative rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 px-4 py-3 overflow-visible' +
        (explanation && narrow ? ' cursor-pointer' : '') +
        (explanation && !narrow ? ' md:group cursor-help' : '')
      }
      onClick={() => explanation && narrow && setOpen((o) => !o)}
      onKeyDown={(e) => {
        if (explanation && narrow && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setOpen((o) => !o);
        }
      }}
      role={explanation && narrow ? 'button' : undefined}
      tabIndex={explanation && narrow ? 0 : undefined}
      aria-expanded={explanation && narrow ? open : undefined}
    >
      {explanation && !narrow ? (
        <div
          role="tooltip"
          className="hidden md:block absolute top-full left-0 right-0 z-50 mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-lg text-xs text-gray-700 dark:text-gray-300 leading-snug opacity-0 invisible transition-opacity delay-75 pointer-events-none max-h-48 overflow-y-auto md:group-hover:opacity-100 md:group-hover:visible md:group-hover:delay-100"
        >
          {explanation}
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wider text-gray-500 flex-1 min-w-0">{label}</p>
        {explanation && narrow ? (
          <span className="text-[10px] text-gray-600 shrink-0 select-none" aria-hidden>
            ⓘ
          </span>
        ) : null}
      </div>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1 tabular-nums">{value}</p>
      {hint ? <p className="text-[10px] text-gray-600 mt-0.5">{hint}</p> : null}
      {explanation && narrow && open ? (
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-800 leading-relaxed">{explanation}</p>
      ) : null}
    </div>
  );
}

function ExplainableSectionTitle({ title, explanation }: { title: string; explanation: string }) {
  const narrow = useMatchMedia('(max-width: 767px)');
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-3 overflow-visible">
      <div
        className={
          'flex items-start gap-2 w-full' +
          (narrow ? ' cursor-pointer' : ' md:group relative w-fit max-w-full cursor-help')
        }
        onClick={() => narrow && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (narrow && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        role={narrow ? 'button' : undefined}
        tabIndex={narrow ? 0 : undefined}
        aria-expanded={narrow ? open : undefined}
      >
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-left flex-1 min-w-0">
          {title}
        </h2>
        {narrow ? (
          <span className="text-gray-600 text-xs shrink-0 select-none mt-0.5" aria-hidden>
            ⓘ
          </span>
        ) : (
          <div
            role="tooltip"
            className="hidden md:block absolute top-full left-0 z-50 mt-1 w-72 max-w-[min(18rem,calc(100vw-2rem))] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-lg text-xs text-gray-700 dark:text-gray-300 leading-snug opacity-0 invisible transition-opacity pointer-events-none md:group-hover:opacity-100 md:group-hover:visible"
          >
            {explanation}
          </div>
        )}
      </div>
      {narrow && open ? (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed border-l-2 border-gray-300 dark:border-gray-700 pl-3">{explanation}</p>
      ) : null}
    </div>
  );
}

function ExplainableHint({ children, explanation, className }: { children: ReactNode; explanation: string; className?: string }) {
  const narrow = useMatchMedia('(max-width: 767px)');
  const [open, setOpen] = useState(false);

  return (
    <div className={className ? `${className} overflow-visible` : 'overflow-visible'}>
      <div
        className={
          'inline-flex flex-wrap items-start gap-2 max-w-full relative' +
          (narrow ? ' cursor-pointer' : ' md:group cursor-help')
        }
        onClick={() => narrow && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (narrow && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        role={narrow ? 'button' : undefined}
        tabIndex={narrow ? 0 : undefined}
        aria-expanded={narrow ? open : undefined}
      >
        <span className="min-w-0">{children}</span>
        {narrow ? (
          <span className="text-gray-600 text-xs shrink-0 select-none" aria-hidden>
            ⓘ
          </span>
        ) : (
          <div
            role="tooltip"
            className="hidden md:block absolute top-full left-0 z-50 mt-1 w-72 max-w-[min(18rem,calc(100vw-2rem))] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-lg text-xs text-gray-700 dark:text-gray-300 leading-snug opacity-0 invisible transition-opacity pointer-events-none md:group-hover:opacity-100 md:group-hover:visible"
          >
            {explanation}
          </div>
        )}
      </div>
      {narrow && open ? <p className="text-xs text-gray-500 mt-2 leading-relaxed">{explanation}</p> : null}
    </div>
  );
}

function ExplainableRow({
  label,
  value,
  explanation,
}: {
  label: string;
  value: ReactNode;
  explanation: string;
}) {
  const narrow = useMatchMedia('(max-width: 767px)');
  const [open, setOpen] = useState(false);

  return (
    <li className="border-b border-gray-200/80 dark:border-gray-800/80 pb-2 last:border-0 overflow-visible">
      <div
        className={
          'flex justify-between gap-4 items-start' +
          (narrow ? ' cursor-pointer' : ' md:group relative cursor-help')
        }
        onClick={() => narrow && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (narrow && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        role={narrow ? 'button' : undefined}
        tabIndex={narrow ? 0 : undefined}
        aria-expanded={narrow ? open : undefined}
      >
        <div className="flex items-start gap-2 min-w-0 flex-1 relative">
          <span className="text-gray-600 dark:text-gray-400">{label}</span>
          {narrow ? (
            <span className="text-gray-600 text-xs shrink-0 select-none" aria-hidden>
              ⓘ
            </span>
          ) : (
            <div
              role="tooltip"
              className="hidden md:block absolute top-full left-0 z-50 mt-1 w-72 max-w-[min(18rem,calc(100vw-2rem))] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 shadow-lg text-xs text-gray-700 dark:text-gray-300 leading-snug opacity-0 invisible transition-opacity pointer-events-none md:group-hover:opacity-100 md:group-hover:visible"
            >
              {explanation}
            </div>
          )}
        </div>
        <span className="shrink-0 text-right">{value}</span>
      </div>
      {narrow && open ? (
        <p className="text-xs text-gray-500 mt-2 pl-1 leading-relaxed border-l-2 border-gray-300 dark:border-gray-700">{explanation}</p>
      ) : null}
    </li>
  );
}
