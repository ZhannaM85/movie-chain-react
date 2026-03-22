import { utcDateString } from './profile';

/** GitHub-style grid: 53 columns × 7 rows = 371 days */
export const HEATMAP_WEEKS = 53;
export const HEATMAP_TOTAL_DAYS = HEATMAP_WEEKS * 7;

export interface HeatmapCell {
  date: string;
  count: number;
}

export function buildHeatmapCells(moviesAddedByDate: Record<string, number>): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < HEATMAP_TOTAL_DAYS; i++) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - (HEATMAP_TOTAL_DAYS - 1 - i));
    const ds = utcDateString(d);
    cells.push({ date: ds, count: moviesAddedByDate[ds] ?? 0 });
  }
  return cells;
}

export function splitIntoWeekColumns(cells: HeatmapCell[]): HeatmapCell[][] {
  const weeks: HeatmapCell[][] = [];
  for (let c = 0; c < HEATMAP_WEEKS; c++) {
    weeks.push(cells.slice(c * 7, (c + 1) * 7));
  }
  return weeks;
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
