import { localDateString } from '../lib/dateUtils';
import type { ChainLink } from '../types/movie';

/** Minimum span: ~53 ISO weeks of calendar days. */
export const HEATMAP_WEEKS = 53;
export const HEATMAP_TOTAL_DAYS = HEATMAP_WEEKS * 7;

/** Cap how far back the heatmap spans when older activity exists. */
const HEATMAP_MAX_DAYS = 730;

export interface HeatmapCell {
  date: string;
  count: number;
}

export interface CalendarHeatmapResult {
  /** Each column is one ISO week (Mon→Sun, top to bottom). Newest week first (left). */
  columns: HeatmapCell[][];
  maxCount: number;
}

function oldestNonZeroDateKey(moviesAddedByDate: Record<string, number>): string | null {
  const keys = Object.keys(moviesAddedByDate).filter((k) => (moviesAddedByDate[k] ?? 0) > 0);
  if (keys.length === 0) return null;
  return keys.sort()[0];
}

/**
 * Merges persisted daily counts with the current chain’s `loggedDate` values.
 * Keeps the heatmap aligned with /chain when profile storage was missing a day.
 */
export function mergeMoviesAddedByDateWithChainLinks(
  moviesAddedByDate: Record<string, number>,
  links: ChainLink[]
): Record<string, number> {
  const merged: Record<string, number> = { ...moviesAddedByDate };
  const fromLinks = new Map<string, number>();
  for (const link of links) {
    const d = link.loggedDate?.trim();
    if (!d) continue;
    fromLinks.set(d, (fromLinks.get(d) ?? 0) + 1);
  }
  for (const [date, n] of fromLinks) {
    merged[date] = Math.max(merged[date] ?? 0, n);
  }
  return merged;
}

/** Local midnight date (no time drift). */
function calendarDate(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Monday 00:00 local time of the ISO week that contains `d`. */
export function startOfWeekMonday(d: Date): Date {
  const x = calendarDate(d);
  const day = x.getDay();
  const diffFromMonday = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diffFromMonday);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = calendarDate(d);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Builds a GitHub-style grid where each column is a real calendar week (Mon–Sun)
 * and each cell maps to exactly one local calendar day. Columns are newest-first.
 */
export function buildCalendarHeatmapWeeks(moviesAddedByDate: Record<string, number>): CalendarHeatmapResult {
  const end = calendarDate(new Date());

  let totalDays = HEATMAP_TOTAL_DAYS;
  const oldestKey = oldestNonZeroDateKey(moviesAddedByDate);
  if (oldestKey) {
    const oldest = new Date(`${oldestKey}T12:00:00`);
    const diffDays =
      Math.floor((end.getTime() - calendarDate(oldest).getTime()) / (24 * 60 * 60 * 1000)) + 1;
    totalDays = Math.max(HEATMAP_TOTAL_DAYS, Math.min(Math.max(diffDays, 1), HEATMAP_MAX_DAYS));
  }

  const rangeStart = addDays(end, -(totalDays - 1));

  const firstMonday = startOfWeekMonday(rangeStart);
  const lastMonday = startOfWeekMonday(end);

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const numWeeks = Math.floor((lastMonday.getTime() - firstMonday.getTime()) / weekMs) + 1;

  const columns: HeatmapCell[][] = [];
  let maxCount = 0;

  for (let w = 0; w < numWeeks; w++) {
    const monday = addDays(firstMonday, w * 7);
    const weekCells: HeatmapCell[] = [];

    for (let dow = 0; dow < 7; dow++) {
      const d = addDays(monday, dow);
      const ds = localDateString(d);
      const inRange = d.getTime() >= rangeStart.getTime() && d.getTime() <= end.getTime();
      const count = inRange ? (moviesAddedByDate[ds] ?? 0) : 0;
      if (inRange) {
        maxCount = Math.max(maxCount, count);
      }
      weekCells.push({ date: ds, count });
    }
    columns.push(weekCells);
  }

  columns.reverse();

  return { columns, maxCount };
}

export function maxHeatmapCount(cells: HeatmapCell[]): number {
  return cells.reduce((m, c) => Math.max(m, c.count), 0);
}

/** Map activity count to 0 (empty) … 4 (most) for styling */
export function intensityLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (max <= 0) return 1;
  const r = count / max;
  if (r <= 0.25) return 1;
  if (r <= 0.5) return 2;
  if (r <= 0.75) return 3;
  return 4;
}
