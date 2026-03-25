import { describe, expect, it } from 'vitest';
import { findHeroChainIndexByLastWatched } from './chainHero';
import type { ChainLink } from '../types/movie';

function link(loggedDate: string | null | undefined): ChainLink {
  return {
    movie: { id: 1, title: 'x', overview: '', poster_path: null, backdrop_path: null, release_date: '', vote_average: 0, vote_count: 0, popularity: 0 },
    connectingActorId: null,
    connectingActorName: null,
    comment: '',
    loggedDate,
  };
}

describe('findHeroChainIndexByLastWatched', () => {
  it('returns index with latest loggedDate', () => {
    const links: ChainLink[] = [link('2024-01-01'), link('2025-06-15'), link('2025-03-01')];
    expect(findHeroChainIndexByLastWatched(links)).toBe(1);
  });

  it('on same date prefers higher index', () => {
    const links: ChainLink[] = [link('2025-06-15'), link('2025-06-15')];
    expect(findHeroChainIndexByLastWatched(links)).toBe(1);
  });

  it('falls back to tail when no dates', () => {
    const links: ChainLink[] = [link(null), link(undefined), link('')];
    expect(findHeroChainIndexByLastWatched(links)).toBe(2);
  });
});
