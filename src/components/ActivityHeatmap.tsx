import { useMemo, useState, useCallback, useRef, useLayoutEffect } from 'react';
import { buildCalendarHeatmapWeeks, intensityLevel } from '../gamification/heatmap';
import { useTranslation } from 'react-i18next';

const LEVEL_CLASS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: 'bg-gray-100 border border-gray-200 dark:bg-gray-900 dark:border-gray-700',
  1: 'bg-emerald-200 border border-emerald-300 dark:bg-emerald-900/70 dark:border-emerald-800',
  2: 'bg-emerald-400 border border-emerald-500 dark:bg-emerald-700 dark:border-emerald-600',
  3: 'bg-emerald-600 border border-emerald-700 dark:bg-emerald-600 dark:border-emerald-500',
  4: 'bg-emerald-800 border border-emerald-900 dark:bg-emerald-500 dark:border-emerald-400',
};

interface ActivityHeatmapProps {
  moviesAddedByDate: Record<string, number>;
}

/**
 * Activity grid: each column is one calendar week (Mon–Sun). Rows align with weekdays.
 * Older weeks on the left, newer weeks on the right; each cell is one local calendar day.
 */
export default function ActivityHeatmap({ moviesAddedByDate }: ActivityHeatmapProps) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<{ date: string; count: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatDayLabel = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(`${iso}T12:00:00`)),
    [i18n.language]
  );

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

  /** Show the most recent weeks (right side); otherwise the wide grid loads scrolled to empty past weeks. */
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const toEnd = () => {
      el.scrollLeft = el.scrollWidth - el.clientWidth;
    };
    toEnd();
    const id = requestAnimationFrame(toEnd);
    return () => cancelAnimationFrame(id);
  }, [columns]);

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
        <div ref={scrollRef} className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex w-max min-w-full gap-px h-24 sm:h-28">
            {columns.map((week) => (
              <div
                key={week[0]?.date}
                className="flex min-w-0 w-3 sm:w-3.5 flex-shrink-0 flex-col gap-px"
              >
                {week.map((cell) => {
                  const level = intensityLevel(cell.count, maxCount);
                  const dateLabel = formatDayLabel(cell.date);
                  const title =
                    cell.count === 0
                      ? t('heatmapDayEmpty', { date: dateLabel })
                      : t('heatmapDayMovies', { date: dateLabel, count: cell.count });
                  const isSelected = selected?.date === cell.date;
                  return (
                    <button
                      key={cell.date}
                      type="button"
                      title={title}
                      aria-label={title}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelected((prev) =>
                          prev?.date === cell.date ? null : { date: cell.date, count: cell.count }
                        );
                      }}
                      className={`min-h-0 flex-1 rounded-sm text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950 ${LEVEL_CLASS[level]} ${
                        isSelected ? 'ring-2 ring-indigo-400 ring-inset' : ''
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {selected && (
        <p className="text-sm text-gray-800 dark:text-gray-200 mt-3" role="status" aria-live="polite">
          {selected.count === 0
            ? t('heatmapDayEmpty', { date: formatDayLabel(selected.date) })
            : t('heatmapDayMovies', { date: formatDayLabel(selected.date), count: selected.count })}
        </p>
      )}
      <p className="text-[10px] text-gray-600 mt-2">{t('heatmapLocalHint')}</p>
    </div>
  );
}
