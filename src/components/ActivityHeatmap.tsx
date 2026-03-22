import { useMemo } from 'react';
import {
  buildHeatmapCells,
  intensityLevel,
  maxHeatmapCount,
  splitIntoWeekColumns,
} from '../gamification/heatmap';
import { useTranslation } from 'react-i18next';

const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-gray-800 border border-gray-800',
  1: 'bg-emerald-950/80 border border-emerald-900/50',
  2: 'bg-emerald-800/70 border border-emerald-700/40',
  3: 'bg-emerald-600/70 border border-emerald-500/40',
  4: 'bg-emerald-400/80 border border-emerald-300/40',
};

interface ActivityHeatmapProps {
  moviesAddedByDate: Record<string, number>;
}

/**
 * GitHub-style contribution graph: 53 weeks × 7 days (UTC), left = older.
 */
export default function ActivityHeatmap({ moviesAddedByDate }: ActivityHeatmapProps) {
  const { t } = useTranslation();
  const { columns, maxCount } = useMemo(() => {
    const cells = buildHeatmapCells(moviesAddedByDate);
    return {
      columns: splitIntoWeekColumns(cells),
      maxCount: maxHeatmapCount(cells),
    };
  }, [moviesAddedByDate]);

  return (
    <div className="w-full pb-1">
      <div className="flex w-full gap-px h-24 sm:h-28">
        {columns.map((week, wi) => (
          <div key={wi} className="flex min-w-0 flex-1 flex-col gap-px">
            {week.map((cell) => {
              const level = intensityLevel(cell.count, maxCount);
              const title =
                cell.count === 0
                  ? t('heatmapDayEmpty', { date: cell.date })
                  : t('heatmapDayMovies', { date: cell.date, count: cell.count });
              return (
                <div
                  key={cell.date}
                  title={title}
                  className={`min-h-0 flex-1 rounded-sm ${LEVEL_CLASS[level]}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-600 mt-2">{t('heatmapUtcHint')}</p>
    </div>
  );
}
