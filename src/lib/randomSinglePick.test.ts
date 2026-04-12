import { describe, it, expect } from 'vitest';
import {
  eligibleActorIdsForRandomPick,
  eligibleMovieIdsForRandomPick,
  pickRandomSelectableId,
  RANDOM_SINGLE_PICK_POOL_EXPAND_STEP,
  RANDOM_SINGLE_PICK_POOL_MAX,
} from './randomSinglePick';

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

describe('eligibleActorIdsForRandomPick', () => {
  it('uses first window rows and skips bridges', () => {
    const cast = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }));
    const bridges = new Set([2, 4]);
    const out = eligibleActorIdsForRandomPick(cast, bridges);
    expect(out).toEqual([1, 3, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('returns fewer when cast is short', () => {
    const cast = [{ id: 1 }, { id: 2 }];
    expect(eligibleActorIdsForRandomPick(cast, new Set())).toEqual([1, 2]);
  });

  it('expands window when first 12 rows are all bridges', () => {
    const cast = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }));
    const bridges = new Set(Array.from({ length: 12 }, (_, i) => i + 1));
    const out = eligibleActorIdsForRandomPick(cast, bridges);
    expect(out[0]).toBe(13);
    expect(out.length).toBe(RANDOM_SINGLE_PICK_POOL_EXPAND_STEP);
  });
});

describe('eligibleMovieIdsForRandomPick', () => {
  it('uses eligible titles only within the first window rows', () => {
    const movies = Array.from({ length: 30 }, (_, i) => ({ id: i + 1 }));
    const chain = new Set([1, 2, 3]);
    const out = eligibleMovieIdsForRandomPick(movies, chain);
    expect(out).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('returns empty when every movie is in the chain', () => {
    const movies = [{ id: 1 }];
    expect(eligibleMovieIdsForRandomPick(movies, new Set([1]))).toEqual([]);
  });

  it('expands window when first 12 rows are all in the chain', () => {
    const movies = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
    const chain = new Set(Array.from({ length: 12 }, (_, i) => i + 1));
    const out = eligibleMovieIdsForRandomPick(movies, chain);
    expect(out).toEqual([13, 14, 15, 16, 17]);
    expect(out.length).toBe(RANDOM_SINGLE_PICK_POOL_EXPAND_STEP);
  });

  it('keeps expanding until eligible rows exist', () => {
    const movies = Array.from({ length: 40 }, (_, i) => ({ id: i + 1 }));
    const chain = new Set(Array.from({ length: 17 }, (_, i) => i + 1));
    const out = eligibleMovieIdsForRandomPick(movies, chain);
    expect(out[0]).toBe(18);
    expect(out.length).toBe(5);
  });
});
