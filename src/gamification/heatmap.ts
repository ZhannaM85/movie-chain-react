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
  /** Per chain-run counts for this calendar day (string strike ids). */
  byStrike: Record<string, number>;
}

export interface CalendarHeatmapResult {
  /** Each column is one ISO week (Mon→Sun, top to bottom). Older weeks left, newer weeks right. */
  columns: HeatmapCell[][];
  maxCount: number;
}

export function sumStrikesForDate(byStrike: Record<string, number> | undefined): number {
  if (!byStrike) return 0;
  let s = 0;
  for (const v of Object.values(byStrike)) {
    if (typeof v === 'number' && v > 0) s += v;
  }
  return s;
}

/** Strike with the largest count; ties break to the lowest numeric id. */
export function dominantStrikeId(byStrike: Record<string, number> | undefined): number | null {
  if (!byStrike || Object.keys(byStrike).length === 0) return null;
  let bestId: number | null = null;
  let bestN = 0;
  for (const [k, v] of Object.entries(byStrike)) {
    if (typeof v !== 'number' || v <= 0) continue;
    const id = Number(k);
    if (!Number.isFinite(id)) continue;
    if (bestId === null || v > bestN || (v === bestN && id < bestId)) {
      bestId = id;
      bestN = v;
    }
  }
  return bestId;
}

/**
 * Hue for heatmap cells: when strike `0` (legacy / default run) mixes with another run on the same day,
 * cap how much `0` competes so newer runs can still show their color while intensity stays total-based.
 */
export function dominantStrikeIdForHeatmapHue(byStrike: Record<string, number> | undefined): number | null {
  if (!byStrike || Object.keys(byStrike).length === 0) return null;
  let maxOther = 0;
  for (const [k, v] of Object.entries(byStrike)) {
    if (typeof v !== 'number' || v <= 0) continue;
    if (k === '0') continue;
    maxOther = Math.max(maxOther, v);
  }
  let bestId: number | null = null;
  let bestAdj = -1;
  for (const [k, v] of Object.entries(byStrike)) {
    if (typeof v !== 'number' || v <= 0) continue;
    const id = Number(k);
    if (!Number.isFinite(id)) continue;
    const adj = k === '0' && maxOther > 0 ? Math.min(v, maxOther) : v;
    if (bestId === null || adj > bestAdj || (adj === bestAdj && id > bestId)) {
      bestId = id;
      bestAdj = adj;
    }
  }
  return bestId;
}

function oldestNonZeroDateKeyFromByStrike(map: Record<string, Record<string, number>>): string | null {
  const keys = Object.keys(map).filter((k) => sumStrikesForDate(map[k]) > 0);
  if (keys.length === 0) return null;
  return keys.sort()[0];
}

function linkStrikeKey(link: ChainLink): string {
  return String(link.heatmapStrikeId ?? 0);
}

/**
 * Merges persisted per-strike daily counts with the current chain’s `loggedDate` + `heatmapStrikeId`.
 * Per (date, strike), uses `max(persisted, count from links)` — same idea as the legacy flat merge.
 */
export function mergeMoviesAddedByDateByStrikeWithChainLinks(
  moviesAddedByDateByStrike: Record<string, Record<string, number>>,
  links: ChainLink[]
): Record<string, Record<string, number>> {
  const merged: Record<string, Record<string, number>> = {};
  for (const [date, strikes] of Object.entries(moviesAddedByDateByStrike)) {
    merged[date] = { ...strikes };
  }
  const fromLinks = new Map<string, Map<string, number>>();
  for (const link of links) {
    const d = link.loggedDate?.trim();
    if (!d) continue;
    const s = linkStrikeKey(link);
    if (!fromLinks.has(d)) fromLinks.set(d, new Map());
    const m = fromLinks.get(d)!;
    m.set(s, (m.get(s) ?? 0) + 1);
  }
  for (const [date, strikeMap] of fromLinks) {
    const existing = merged[date] ?? {};
    const next = { ...existing };
    for (const [strike, n] of strikeMap) {
      next[strike] = Math.max(next[strike] ?? 0, n);
    }
    merged[date] = next;
  }
  return merged;
}

/** Flat per-day totals (for streaks, busiest day). */
export function totalPerDateFromByStrike(
  byStrikeMap: Record<string, Record<string, number>>
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [date, strikes] of Object.entries(byStrikeMap)) {
    const t = sumStrikesForDate(strikes);
    if (t > 0) out[date] = t;
  }
  return out;
}

/**
 * @deprecated Prefer mergeMoviesAddedByDateByStrikeWithChainLinks + totalPerDateFromByStrike.
 * Merges flat daily counts with link counts (no strike split).
 */
export function mergeMoviesAddedByDateWithChainLinks(
  moviesAddedByDate: Record<string, number>,
  links: ChainLink[]
): Record<string, number> {
  const byStrike: Record<string, Record<string, number>> = {};
  for (const [d, n] of Object.entries(moviesAddedByDate)) {
    if (typeof n === 'number' && n > 0) byStrike[d] = { '0': n };
  }
  return totalPerDateFromByStrike(mergeMoviesAddedByDateByStrikeWithChainLinks(byStrike, links));
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
 * Builds a contribution-style grid: each column is one ISO week (Mon–Sun),
 * each cell one local calendar day. Columns run in chronological order (older left, newer right).
 */
export function buildCalendarHeatmapWeeks(
  moviesAddedByDateByStrike: Record<string, Record<string, number>>
): CalendarHeatmapResult {
  const end = calendarDate(new Date());

  let totalDays = HEATMAP_TOTAL_DAYS;
  const oldestKey = oldestNonZeroDateKeyFromByStrike(moviesAddedByDateByStrike);
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
      const byStrike = inRange ? { ...(moviesAddedByDateByStrike[ds] ?? {}) } : {};
      const count = sumStrikesForDate(byStrike);
      if (inRange) {
        maxCount = Math.max(maxCount, count);
      }
      weekCells.push({ date: ds, count, byStrike });
    }
    columns.push(weekCells);
  }

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
