import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useChainContext } from '../context/ChainContext';
import ActivityHeatmap from '../components/ActivityHeatmap';
import { getTopActorBridges } from '../gamification/actorStats';
import { useTranslation } from 'react-i18next';

/**
 * Local “profile” stats: activity heatmap, streaks, top bridge actors, totals.
 */
export default function UserStatsPage() {
  const { gamificationProfile: p } = useChainContext();
  const { t } = useTranslation();

  const topActors = useMemo(() => getTopActorBridges(p, 12), [p]);

  const busiestDay = useMemo(() => {
    let bestDate: string | null = null;
    let bestCount = 0;
    for (const [date, count] of Object.entries(p.moviesAddedByDate)) {
      if (count > bestCount) {
        bestCount = count;
        bestDate = date;
      }
    }
    return bestDate && bestCount > 0 ? { date: bestDate, count: bestCount } : null;
  }, [p.moviesAddedByDate]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{t('userStatsTitle')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('userStatsSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <StatCard label={t('statTotalMoviesLogged')} value={String(p.totalLinksAddedAllTime)} />
        <StatCard label={t('statChallengePointsTotal')} value={String(p.totalChallengePointsAllTime)} />
        <StatCard label={t('statLongestStreak')} value={String(p.longestStreakEver)} hint={t('statDaysUtc')} />
        <StatCard label={t('statCurrentStreak')} value={String(p.currentStreak)} hint={t('statDaysUtc')} />
      </div>

      <div className="mb-10">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {t('heatmapSectionTitle')}
        </h2>
        <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
          <ActivityHeatmap moviesAddedByDate={p.moviesAddedByDate} />
        </div>
        {busiestDay && (
          <p className="text-xs text-gray-500 mt-3">
            {t('statBusiestDay', { date: busiestDay.date, count: busiestDay.count })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('topActorsSectionTitle')}
          </h2>
          {topActors.length === 0 ? (
            <p className="text-sm text-gray-600">{t('topActorsEmpty')}</p>
          ) : (
            <ul className="space-y-2">
              {topActors.map((a, i) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-gray-800/50 border border-gray-800 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-600 w-5 flex-shrink-0">{i + 1}</span>
                    <Link
                      to={`/actor/${a.id}`}
                      className="text-sm text-indigo-400 hover:text-indigo-300 truncate"
                    >
                      {a.name}
                    </Link>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0 tabular-nums">
                    {t('actorBridgeTimes', { count: a.count })}
                  </span>
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
            <li className="flex justify-between gap-4 border-b border-gray-800/80 pb-2">
              <span>{t('statLongestChain')}</span>
              <span className="text-gray-200 tabular-nums">{p.longestChainEver}</span>
            </li>
            <li className="flex justify-between gap-4 border-b border-gray-800/80 pb-2">
              <span>{t('statAchievementsUnlocked')}</span>
              <span className="text-gray-200 tabular-nums">{p.unlockedAchievementIds.length}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>{t('statFirstNoteWritten')}</span>
              <span className="text-gray-200">{p.hasWrittenNoteBefore ? t('yes') : t('no')}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-white mt-1 tabular-nums">{value}</p>
      {hint ? <p className="text-[10px] text-gray-600 mt-0.5">{hint}</p> : null}
    </div>
  );
}
