import { useMemo, useState, useCallback, useRef, useLayoutEffect } from 'react';
import {
  buildCalendarHeatmapWeeks,
  dominantStrikeIdForHeatmapHue,
  intensityLevel,
} from '../gamification/heatmap';
import { useTranslation } from 'react-i18next';

/** Distinct ramps for chain runs (cycles for run id ≥ length). */
export const HEATMAP_STRIKE_PALETTES = [
  {
    0: 'bg-gray-100 border border-gray-200 dark:bg-gray-900 dark:border-gray-700',
    1: 'bg-emerald-200 border border-emerald-300 dark:bg-emerald-900/70 dark:border-emerald-800',
    2: 'bg-emerald-400 border border-emerald-500 dark:bg-emerald-700 dark:border-emerald-600',
    3: 'bg-emerald-600 border border-emerald-700 dark:bg-emerald-600 dark:border-emerald-500',
    4: 'bg-emerald-800 border border-emerald-900 dark:bg-emerald-500 dark:border-emerald-400',
  },
  {
    0: 'bg-gray-100 border border-gray-200 dark:bg-gray-900 dark:border-gray-700',
    1: 'bg-sky-200 border border-sky-300 dark:bg-sky-900/70 dark:border-sky-800',
    2: 'bg-sky-400 border border-sky-500 dark:bg-sky-700 dark:border-sky-600',
    3: 'bg-sky-600 border border-sky-700 dark:bg-sky-600 dark:border-sky-500',
    4: 'bg-sky-800 border border-sky-900 dark:bg-sky-500 dark:border-sky-400',
  },
  {
    0: 'bg-gray-100 border border-gray-200 dark:bg-gray-900 dark:border-gray-700',
    1: 'bg-amber-200 border border-amber-300 dark:bg-amber-900/70 dark:border-amber-800',
    2: 'bg-amber-400 border border-amber-500 dark:bg-amber-700 dark:border-amber-600',
    3: 'bg-amber-600 border border-amber-700 dark:bg-amber-600 dark:border-amber-500',
    4: 'bg-amber-800 border border-amber-900 dark:bg-amber-500 dark:border-amber-400',
  },
] as const;

type Level = 0 | 1 | 2 | 3 | 4;

function paletteClass(paletteIndex: number, level: Level): string {
  const pal = HEATMAP_STRIKE_PALETTES[paletteIndex % HEATMAP_STRIKE_PALETTES.length];
  return pal[level];
}

interface ActivityHeatmapProps {
  moviesAddedByDateByStrike: Record<string, Record<string, number>>;
}

function collectStrikeIdsInColumns(
  columns: { byStrike: Record<string, number>; count: number }[][]
): number[] {
  const set = new Set<number>();
  for (const week of columns) {
    for (const cell of week) {
      if (cell.count <= 0) continue;
      for (const [k, v] of Object.entries(cell.byStrike)) {
        if (typeof v === 'number' && v > 0) {
          const id = Number(k);
          if (Number.isFinite(id)) set.add(id);
        }
      }
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

/**
 * Activity grid: each column is one calendar week (Mon–Sun). Rows align with weekdays.
 * Older weeks on the left, newer weeks on the right; each cell is one local calendar day.
 */
export default function ActivityHeatmap({ moviesAddedByDateByStrike }: ActivityHeatmapProps) {
  const { t, i18n } = useTranslation();
  const [selected, setSelected] = useState<{
    date: string;
    count: number;
    byStrike: Record<string, number>;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatDayLabel = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(`${iso}T12:00:00`)),
    [i18n.language]
  );

  const strikeBreakdownText = useCallback(
    (byStrike: Record<string, number>) => {
      const parts = Object.entries(byStrike)
        .filter(([, v]) => typeof v === 'number' && v > 0)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([id, count]) =>
          t('heatmapDayStrikePart', {
            run: t('heatmapStrikeRun', { n: Number(id) + 1 }),
            count,
          })
        );
      return parts.join(t('heatmapStrikeBreakdownJoiner'));
    },
    [t]
  );

  const dayTitle = useCallback(
    (dateLabel: string, count: number, byStrike: Record<string, number>) => {
      if (count === 0) return t('heatmapDayEmpty', { date: dateLabel });
      const base = t('heatmapDayMovies', { date: dateLabel, count });
      const distinctRuns = Object.keys(byStrike).filter((k) => (byStrike[k] ?? 0) > 0).length;
      if (distinctRuns <= 1) return base;
      return `${base} (${strikeBreakdownText(byStrike)})`;
    },
    [t, strikeBreakdownText]
  );

  const { columns, maxCount, weekdayLabels, legendStrikeIds } = useMemo(() => {
    const { columns: cols, maxCount: max } = buildCalendarHeatmapWeeks(moviesAddedByDateByStrike);
    const fmt = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' });
    const labels: string[] = [];
    const refMonday = new Date(2024, 0, 1);
    for (let i = 0; i < 7; i++) {
      const d = new Date(refMonday);
      d.setDate(refMonday.getDate() + i);
      labels.push(fmt.format(d));
    }
    return {
      columns: cols,
      maxCount: max,
      weekdayLabels: labels,
      legendStrikeIds: collectStrikeIdsInColumns(cols),
    };
  }, [moviesAddedByDateByStrike, i18n.language]);

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
                  const level = intensityLevel(cell.count, maxCount) as Level;
                  const dom = cell.count > 0 ? dominantStrikeIdForHeatmapHue(cell.byStrike) : null;
                  const paletteIdx =
                    dom != null ? dom % HEATMAP_STRIKE_PALETTES.length : 0;
                  const dateLabel = formatDayLabel(cell.date);
                  const title = dayTitle(dateLabel, cell.count, cell.byStrike);
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
                          prev?.date === cell.date
                            ? null
                            : { date: cell.date, count: cell.count, byStrike: cell.byStrike }
                        );
                      }}
                      className={`min-h-0 flex-1 rounded-sm text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50 dark:focus-visible:ring-offset-gray-950 ${paletteClass(
                        paletteIdx,
                        level
                      )} ${isSelected ? 'ring-2 ring-indigo-400 ring-inset' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      {legendStrikeIds.length > 1 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-gray-600 dark:text-gray-400">
          <span className="shrink-0">{t('heatmapStrikeLegendLabel')}</span>
          {legendStrikeIds.map((sid) => {
            const p = sid % HEATMAP_STRIKE_PALETTES.length;
            const sampleLevel = 3 as Level;
            return (
              <span key={sid} className="inline-flex items-center gap-1">
                <span
                  className={`inline-block size-3 rounded-sm shrink-0 ${paletteClass(p, sampleLevel)}`}
                  aria-hidden
                />
                {t('heatmapStrikeRun', { n: sid + 1 })}
              </span>
            );
          })}
        </div>
      )}
      {selected && (
        <p className="text-sm text-gray-800 dark:text-gray-200 mt-3" role="status" aria-live="polite">
          {selected.count === 0 ? (
            t('heatmapDayEmpty', { date: formatDayLabel(selected.date) })
          ) : (
            <>
              {t('heatmapDayMovies', {
                date: formatDayLabel(selected.date),
                count: selected.count,
              })}
              {Object.keys(selected.byStrike).filter((k) => (selected.byStrike[k] ?? 0) > 0).length >
                1 && (
                <span className="block text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {strikeBreakdownText(selected.byStrike)}
                </span>
              )}
            </>
          )}
        </p>
      )}
      <p className="text-[10px] text-gray-600 mt-2">{t('heatmapLocalHint')}</p>
    </div>
  );
}
