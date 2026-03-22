import { useMemo } from 'react';
import { buildCalendarHeatmapWeeks, intensityLevel } from '../gamification/heatmap';
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
 * Activity grid: each column is one calendar week (Mon–Sun). Rows align with weekdays.
 * Newest week on the left; each cell is one local calendar day.
 */
export default function ActivityHeatmap({ moviesAddedByDate }: ActivityHeatmapProps) {
  const { t, i18n } = useTranslation();

  const { columns, maxCount, weekdayLabels } = useMemo(() => {
    const { columns: cols, maxCount: max } = buildCalendarHeatmapWeeks(moviesAddedByDate);
    const fmt = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' });
    const labels: string[] = [];
    const refMonday = new Date(2024, 0, 1);
    for (let i = 0; i < 7; i++) {
      const d = new Date(refMonday);
      d.setDate(refMonday.getDate() + i);
      labels.push(fmt.format(d));
    }
    return { columns: cols, maxCount: max, weekdayLabels: labels };
  }, [moviesAddedByDate, i18n.language]);

  return (
    <div className="w-full pb-1">
      <div className="flex gap-1 sm:gap-2 items-stretch">
        <div
          className="flex flex-col justify-between shrink-0 h-24 sm:h-28 pr-1 text-[9px] sm:text-[10px] text-gray-600"
          aria-hidden
        >
          {weekdayLabels.map((label, i) => (
            <span key={i} className="flex items-center justify-end leading-none">
              {label}
            </span>
          ))}
        </div>
        <div className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex w-max min-w-full gap-px h-24 sm:h-28">
            {columns.map((week) => (
              <div
                key={week[0]?.date}
                className="flex min-w-0 w-3 sm:w-3.5 flex-shrink-0 flex-col gap-px"
              >
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
        </div>
      </div>
      <p className="text-[10px] text-gray-600 mt-2">{t('heatmapLocalHint')}</p>
    </div>
  );
}
