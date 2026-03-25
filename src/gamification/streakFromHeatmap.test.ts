import { describe, it, expect } from 'vitest';
import { computeStreakMetricsFromDailyCounts } from './streakFromHeatmap';

function countsForDates(dates: string[]): Record<string, number> {
  const o: Record<string, number> = {};
  for (const d of dates) o[d] = (o[d] ?? 0) + 1;
  return o;
}

describe('computeStreakMetricsFromDailyCounts', () => {
  it('counts six consecutive local days as current and longest streak of 6', () => {
    const dates = ['2026-03-20', '2026-03-21', '2026-03-22', '2026-03-23', '2026-03-24', '2026-03-25'];
    const m = computeStreakMetricsFromDailyCounts(countsForDates(dates));
    expect(m.currentStreak).toBe(6);
    expect(m.longestConsecutiveEver).toBe(6);
    expect(m.lastActivityDate).toBe('2026-03-25');
  });

  it('uses the trailing run for current streak when there is a gap in the middle', () => {
    const c = countsForDates(['2026-01-01', '2026-01-02', '2026-01-10', '2026-01-11']);
    const m = computeStreakMetricsFromDailyCounts(c);
    expect(m.currentStreak).toBe(2);
    expect(m.longestConsecutiveEver).toBe(2);
    expect(m.lastActivityDate).toBe('2026-01-11');
  });

  it('returns zeros when there is no activity', () => {
    const m = computeStreakMetricsFromDailyCounts({});
    expect(m.currentStreak).toBe(0);
    expect(m.longestConsecutiveEver).toBe(0);
    expect(m.lastActivityDate).toBeNull();
  });

  it('ignores days with zero count', () => {
    const m = computeStreakMetricsFromDailyCounts({ '2025-06-01': 3, '2025-06-02': 0 });
    expect(m.currentStreak).toBe(1);
    expect(m.longestConsecutiveEver).toBe(1);
  });
});
