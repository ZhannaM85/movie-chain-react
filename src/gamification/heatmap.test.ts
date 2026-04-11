import { describe, it, expect } from 'vitest';
import {
  buildCalendarHeatmapWeeks,
  dominantStrikeId,
  dominantStrikeIdForHeatmapHue,
  HEATMAP_TOTAL_DAYS,
  intensityLevel,
  maxHeatmapCount,
  mergeMoviesAddedByDateByStrikeWithChainLinks,
  mergeMoviesAddedByDateWithChainLinks,
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

  it('week columns advance left to right (each column Monday is 7 days after the previous)', () => {
    const { columns } = buildCalendarHeatmapWeeks({});
    expect(columns.length).toBeGreaterThan(1);
    const a = new Date(`${columns[0][0].date}T12:00:00`);
    const b = new Date(`${columns[1][0].date}T12:00:00`);
    const diffDays = (b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000);
    expect(diffDays).toBe(7);
  });

  it('extends backward when activity is older than default window', () => {
    const { columns } = buildCalendarHeatmapWeeks({ '2020-06-01': { '0': 2 } });
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
    expect(
      maxHeatmapCount([
        { date: 'a', count: 0, byStrike: {} },
        { date: 'b', count: 5, byStrike: { '0': 5 } },
      ])
    ).toBe(5);
  });

  it('dominantStrikeId picks max count, tie-break lower id', () => {
    expect(dominantStrikeId({ '0': 2, '1': 3 })).toBe(1);
    expect(dominantStrikeId({ '0': 2, '1': 2 })).toBe(0);
    expect(dominantStrikeId({})).toBeNull();
  });

  it('dominantStrikeIdForHeatmapHue caps strike 0 when another run exists', () => {
    expect(dominantStrikeIdForHeatmapHue({ '0': 26, '1': 2 })).toBe(1);
    expect(dominantStrikeIdForHeatmapHue({ '0': 5 })).toBe(0);
    expect(dominantStrikeIdForHeatmapHue({ '0': 3, '1': 3 })).toBe(1);
  });

  it('mergeMoviesAddedByDateByStrikeWithChainLinks mirrors max per date and strike', () => {
    const movie = {
      id: 1,
      title: 'A',
      overview: '',
      poster_path: null,
      backdrop_path: null,
      release_date: '',
      vote_average: 0,
      vote_count: 0,
      popularity: 0,
    };
    const linkBase = {
      movie,
      connectingActorId: null,
      connectingActorName: null,
      comment: '',
    };
    const merged = mergeMoviesAddedByDateByStrikeWithChainLinks(
      { '2026-03-22': { '0': 2 } },
      [{ ...linkBase, loggedDate: '2026-03-08', heatmapStrikeId: 0 }]
    );
    expect(merged['2026-03-08']).toEqual({ '0': 1 });
    expect(merged['2026-03-22']).toEqual({ '0': 2 });
    const merged2 = mergeMoviesAddedByDateByStrikeWithChainLinks(
      { '2026-04-01': { '0': 1, '1': 1 } },
      [
        { ...linkBase, loggedDate: '2026-04-01', heatmapStrikeId: 0 },
        { ...linkBase, loggedDate: '2026-04-01', heatmapStrikeId: 1 },
      ]
    );
    expect(merged2['2026-04-01']).toEqual({ '0': 1, '1': 1 });
  });

  it('mergeMoviesAddedByDateWithChainLinks fills missing days from chain loggedDate', () => {
    const movie = { id: 1, title: 'A', overview: '', poster_path: null, backdrop_path: null, release_date: '', vote_average: 0, vote_count: 0, popularity: 0 };
    const merged = mergeMoviesAddedByDateWithChainLinks(
      { '2026-03-22': 1 },
      [{ movie, connectingActorId: null, connectingActorName: null, comment: '', loggedDate: '2026-03-08' }]
    );
    expect(merged['2026-03-08']).toBe(1);
    expect(merged['2026-03-22']).toBe(1);
  });
});
