import { describe, it, expect } from 'vitest';
import { pickRandomSelectableId } from './randomSinglePick';

describe('pickRandomSelectableId', () => {
  it('returns null for empty ids', () => {
    expect(pickRandomSelectableId([], () => 0.5)).toBeNull();
  });

  it('returns the only id when length is 1', () => {
    expect(pickRandomSelectableId([42], () => 0.99)).toBe(42);
  });

  it('uses rng to pick an index (deterministic)', () => {
    const ids = [10, 20, 30];
    expect(pickRandomSelectableId(ids, () => 0)).toBe(10);
    expect(pickRandomSelectableId(ids, () => 0.33)).toBe(10);
    expect(pickRandomSelectableId(ids, () => 0.34)).toBe(20);
    expect(pickRandomSelectableId(ids, () => 0.66)).toBe(20);
    expect(pickRandomSelectableId(ids, () => 0.67)).toBe(30);
    expect(pickRandomSelectableId(ids, () => 0.99)).toBe(30);
  });

  it('clamps index when rng is 1 edge case', () => {
    const ids = [7, 8];
    expect(pickRandomSelectableId(ids, () => 0.999999)).toBe(8);
  });
});
