import { describe, it, expect } from 'vitest';
import { bridgeActorStepByActorId, usedBridgeActorIds } from './chainLinks';
import type { ChainLink, Movie } from '../types/movie';

const m: Movie = {
  id: 1,
  title: 'A',
  overview: '',
  poster_path: null,
  backdrop_path: null,
  release_date: '2020-01-01',
  vote_average: 7,
  vote_count: 1,
  popularity: 1,
};

function link(
  movieId: number,
  connectingActorId: number | null
): ChainLink {
  return {
    movie: { ...m, id: movieId, title: `M${movieId}` },
    connectingActorId,
    connectingActorName: connectingActorId != null ? 'Actor' : null,
    comment: '',
  };
}

describe('usedBridgeActorIds', () => {
  it('returns empty set for a single link', () => {
    expect(usedBridgeActorIds([link(1, null)]).size).toBe(0);
  });

  it('collects non-null connecting actors from links after the first', () => {
    const s = usedBridgeActorIds([link(1, null), link(2, 10), link(3, 20), link(4, null)]);
    expect([...s].sort((a, b) => a - b)).toEqual([10, 20]);
  });
});

describe('bridgeActorStepByActorId', () => {
  it('returns empty map for a single link', () => {
    expect(bridgeActorStepByActorId([link(1, null)]).size).toBe(0);
  });

  it('maps each bridge actor to from/to movie titles', () => {
    const m = bridgeActorStepByActorId([link(1, null), link(2, 10), link(3, 20)]);
    expect(m.get(10)).toEqual({ fromTitle: 'M1', toTitle: 'M2' });
    expect(m.get(20)).toEqual({ fromTitle: 'M2', toTitle: 'M3' });
  });

  it('keeps the last step when the same actor id bridges twice', () => {
    const m = bridgeActorStepByActorId([
      link(1, null),
      link(2, 99),
      link(3, 99),
    ]);
    expect(m.get(99)).toEqual({ fromTitle: 'M2', toTitle: 'M3' });
  });
});
