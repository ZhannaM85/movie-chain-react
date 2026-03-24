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
import { ACHIEVEMENT_IDS } from '../gamification/types';
import { useTranslation } from 'react-i18next';
import { useMatchMedia } from '../hooks/useMatchMedia';
import { mergeMoviesAddedByDateWithChainLinks } from '../gamification/heatmap';

/**
 * Local “profile” stats: activity heatmap, streaks, top bridge actors, totals.
 */
export default function UserStatsPage() {
  const { gamificationProfile: p, links } = useChainContext();
  const api = useMovieApiForChain();
  const { t } = useTranslation();

  const chainMovieIdsKey = useMemo(() => links.map((l) => l.movie.id).join(','), [links]);

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
    fetchTopCastAppearancesFromApi(links, api, 12)
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

  const heatmapCounts = useMemo(
    () => mergeMoviesAddedByDateWithChainLinks(p.moviesAddedByDate, links),
    [p.moviesAddedByDate, links]
  );

  const topActors = useMemo(() => getTopActorBridges(p, 12), [p]);

  const busiestDay = useMemo(() => {
    let bestDate: string | null = null;
    let bestCount = 0;
    for (const [date, count] of Object.entries(heatmapCounts)) {
      if (count > bestCount) {
        bestCount = count;
        bestDate = date;
      }
    }
    return bestDate && bestCount > 0 ? { date: bestDate, count: bestCount } : null;
  }, [heatmapCounts]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t('userStatsTitle')}</h1>
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

      <div className="mb-10 overflow-visible">
        <ExplainableSectionTitle title={t('heatmapSectionTitle')} explanation={t('heatmapSectionExplain')} />
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
          <ActivityHeatmap moviesAddedByDate={heatmapCounts} />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-visible">
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
                    className="group flex items-center justify-between gap-3 rounded-lg bg-gray-800/50 border border-gray-800 px-3 py-2 w-full min-w-0 text-left no-underline hover:border-indigo-500/50 hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs text-gray-600 w-5 flex-shrink-0">{i + 1}</span>
                      <span className="text-sm text-indigo-400 group-hover:text-indigo-300 truncate">
                        {a.name}
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
                    className="group flex items-center justify-between gap-3 rounded-lg bg-gray-800/50 border border-gray-800 px-3 py-2 w-full min-w-0 text-left no-underline hover:border-indigo-500/50 hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs text-gray-600 w-5 flex-shrink-0">{i + 1}</span>
                      <span className="text-sm text-indigo-400 group-hover:text-indigo-300 truncate">{a.name}</span>
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
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('moreStatsSectionTitle')}
          </h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <ExplainableRow
              label={t('statLongestChain')}
              value={<span className="text-gray-200 tabular-nums">{p.longestChainEver}</span>}
              explanation={t('statExplainMoreLongestChain')}
            />
            <AchievementsUnlockedRow
              count={p.unlockedAchievementIds.length}
              unlockedIds={p.unlockedAchievementIds}
              explanation={t('statExplainMoreAchievements')}
            />
            <ExplainableRow
              label={t('statFirstNoteWritten')}
              value={<span className="text-gray-200">{p.hasWrittenNoteBefore ? t('yes') : t('no')}</span>}
              explanation={t('statExplainMoreFirstNote')}
            />
          </ul>
        </section>
      </div>
    </div>
  );
}

function sortUnlockedAchievementIds(unlockedIds: string[]): string[] {
  const set = new Set(unlockedIds);
  const ordered = ACHIEVEMENT_IDS.filter((id) => set.has(id));
  const rest = unlockedIds.filter((id) => !(ACHIEVEMENT_IDS as readonly string[]).includes(id));
  return [...ordered, ...rest];
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
  const sorted = useMemo(() => sortUnlockedAchievementIds(unlockedIds), [unlockedIds]);

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
        className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 shadow-xl max-h-[85vh] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-800 shrink-0">
          <h2 id="achievements-modal-title" className="text-lg font-semibold text-white pr-2">
            {t('statAchievementsModalTitle')}
          </h2>
          <button
            type="button"
            className="text-sm text-indigo-400 hover:text-indigo-300 px-2 py-1 shrink-0 rounded-lg hover:bg-gray-800/80"
            onClick={onClose}
          >
            {t('statAchievementsModalClose')}
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3 flex-1 min-h-0">
          {sorted.length === 0 ? (
            <p className="text-sm text-gray-500">{t('statAchievementsModalEmpty')}</p>
          ) : (
            <ul className="space-y-3">
              {sorted.map((id) => (
                <li
                  key={id}
                  className="rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2"
                >
                  <p className="text-sm font-medium text-gray-200">
                    {t(`achievement.${id}.title`, { defaultValue: id })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t(`achievement.${id}.desc`, { defaultValue: '' })}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-600 mt-4 pt-3 border-t border-gray-800 leading-relaxed">{explanation}</p>
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
    <li className="border-b border-gray-800/80 pb-2 last:border-0 overflow-visible">
      <button
        type="button"
        className="w-full flex justify-between gap-4 items-start text-left rounded-lg -mx-1 px-1 py-0.5 hover:bg-gray-800/50 border border-transparent hover:border-gray-700/40 transition-colors cursor-pointer group"
        onClick={() => setModalOpen(true)}
        aria-expanded={modalOpen}
        aria-haspopup="dialog"
      >
        <span className="text-gray-400 group-hover:text-indigo-300 transition-colors">
          {t('statAchievementsUnlocked')}
        </span>
        <span className="shrink-0 text-right text-gray-200 tabular-nums group-hover:text-indigo-300 transition-colors">
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
        'relative rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3 overflow-visible' +
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
          className="hidden md:block absolute top-full left-0 right-0 z-50 mt-1 px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 shadow-lg text-xs text-gray-300 leading-snug opacity-0 invisible transition-opacity delay-75 pointer-events-none max-h-48 overflow-y-auto md:group-hover:opacity-100 md:group-hover:visible md:group-hover:delay-100"
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
      <p className="text-2xl font-semibold text-white mt-1 tabular-nums">{value}</p>
      {hint ? <p className="text-[10px] text-gray-600 mt-0.5">{hint}</p> : null}
      {explanation && narrow && open ? (
        <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-800 leading-relaxed">{explanation}</p>
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
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-left flex-1 min-w-0">
          {title}
        </h2>
        {narrow ? (
          <span className="text-gray-600 text-xs shrink-0 select-none mt-0.5" aria-hidden>
            ⓘ
          </span>
        ) : (
          <div
            role="tooltip"
            className="hidden md:block absolute top-full left-0 z-50 mt-1 w-72 max-w-[min(18rem,calc(100vw-2rem))] px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 shadow-lg text-xs text-gray-300 leading-snug opacity-0 invisible transition-opacity pointer-events-none md:group-hover:opacity-100 md:group-hover:visible"
          >
            {explanation}
          </div>
        )}
      </div>
      {narrow && open ? (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed border-l-2 border-gray-700 pl-3">{explanation}</p>
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
            className="hidden md:block absolute top-full left-0 z-50 mt-1 w-72 max-w-[min(18rem,calc(100vw-2rem))] px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 shadow-lg text-xs text-gray-300 leading-snug opacity-0 invisible transition-opacity pointer-events-none md:group-hover:opacity-100 md:group-hover:visible"
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
    <li className="border-b border-gray-800/80 pb-2 last:border-0 overflow-visible">
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
          <span className="text-gray-400">{label}</span>
          {narrow ? (
            <span className="text-gray-600 text-xs shrink-0 select-none" aria-hidden>
              ⓘ
            </span>
          ) : (
            <div
              role="tooltip"
              className="hidden md:block absolute top-full left-0 z-50 mt-1 w-72 max-w-[min(18rem,calc(100vw-2rem))] px-3 py-2 rounded-lg border border-gray-700 bg-gray-800 shadow-lg text-xs text-gray-300 leading-snug opacity-0 invisible transition-opacity pointer-events-none md:group-hover:opacity-100 md:group-hover:visible"
            >
              {explanation}
            </div>
          )}
        </div>
        <span className="shrink-0 text-right">{value}</span>
      </div>
      {narrow && open ? (
        <p className="text-xs text-gray-500 mt-2 pl-1 leading-relaxed border-l-2 border-gray-700">{explanation}</p>
      ) : null}
    </li>
  );
}
