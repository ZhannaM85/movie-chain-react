import { describe, it, expect } from 'vitest';
import {
  buildCalendarHeatmapWeeks,
  HEATMAP_TOTAL_DAYS,
  intensityLevel,
  maxHeatmapCount,
  startOfWeekMonday,
} from './heatmap';

describe('heatmap', () => {
  it('buildCalendarHeatmapWeeks uses ISO weeks with 7 cells per column', () => {
    const { columns } = buildCalendarHeatmapWeeks({});
    expect(columns.length).toBeGreaterThan(0);
    for (const week of columns) {
      expect(week).toHaveLength(7);
    }
  });

  it('each column runs Monday through Sunday consecutive days', () => {
    const { columns } = buildCalendarHeatmapWeeks({});
    const col = columns[0];
    for (let i = 0; i < 6; i++) {
      const a = new Date(`${col[i].date}T12:00:00`);
      const b = new Date(`${col[i + 1].date}T12:00:00`);
      const diffDays = (b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000);
      expect(diffDays).toBe(1);
    }
    const monday = new Date(`${col[0].date}T12:00:00`);
    expect(monday.getDay()).toBe(1);
  });

  it('extends backward when activity is older than default window', () => {
    const { columns } = buildCalendarHeatmapWeeks({ '2020-06-01': 2 });
    const cellCount = columns.reduce((n, w) => n + w.length, 0);
    expect(cellCount).toBeGreaterThanOrEqual(HEATMAP_TOTAL_DAYS);
  });

  it('startOfWeekMonday returns Monday for a Wednesday', () => {
    const wed = new Date(2025, 2, 19);
    const mon = startOfWeekMonday(wed);
    expect(mon.getDay()).toBe(1);
    expect(mon.getDate()).toBe(17);
  });

  it('intensityLevel scales by max', () => {
    expect(intensityLevel(0, 10)).toBe(0);
    expect(intensityLevel(3, 10)).toBe(2);
    expect(intensityLevel(10, 10)).toBe(4);
  });

  it('maxHeatmapCount', () => {
    expect(maxHeatmapCount([{ date: 'a', count: 0 }, { date: 'b', count: 5 }])).toBe(5);
  });
});
