import { describe, expect, it } from 'vitest';
import { findFirstSelectableActorId, findFirstSelectableMovieId } from './sequentialSelection';

describe('findFirstSelectableActorId', () => {
  it('returns the first id not in the bridge set', () => {
    const cast = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const bridge = new Set([1]);
    expect(findFirstSelectableActorId(cast, bridge)).toBe(2);
  });

  it('returns null when every actor is bridge-used', () => {
    const cast = [{ id: 1 }, { id: 2 }];
    expect(findFirstSelectableActorId(cast, new Set([1, 2]))).toBeNull();
  });
});

describe('findFirstSelectableMovieId', () => {
  it('returns the first id not already in the chain', () => {
    const ordered = [{ id: 10 }, { id: 20 }, { id: 30 }];
    const chain = new Set([10]);
    expect(findFirstSelectableMovieId(ordered, chain)).toBe(20);
  });

  it('returns null when every ordered movie is in the chain', () => {
    const ordered = [{ id: 1 }];
    expect(findFirstSelectableMovieId(ordered, new Set([1]))).toBeNull();
  });
});
