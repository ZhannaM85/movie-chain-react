import { describe, it, expect } from 'vitest';
import { buildHeatmapCells, HEATMAP_TOTAL_DAYS, intensityLevel, splitIntoWeekColumns } from './heatmap';

describe('heatmap', () => {
  it('buildHeatmapCells returns fixed length', () => {
    const cells = buildHeatmapCells({});
    expect(cells).toHaveLength(HEATMAP_TOTAL_DAYS);
  });

  it('splitIntoWeekColumns yields 53 weeks', () => {
    const cells = buildHeatmapCells({ '2025-01-01': 3 });
    const weeks = splitIntoWeekColumns(cells);
    expect(weeks).toHaveLength(53);
    expect(weeks[0]).toHaveLength(7);
  });

  it('intensityLevel scales by max', () => {
    expect(intensityLevel(0, 10)).toBe(0);
    expect(intensityLevel(3, 10)).toBe(2);
    expect(intensityLevel(10, 10)).toBe(4);
  });
});
