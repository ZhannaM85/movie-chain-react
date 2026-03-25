import { describe, expect, it } from 'vitest';
import type { ChainLink } from '../types/movie';
import { DEFAULT_GAMIFICATION_PROFILE, type GamificationProfile } from './types';
import {
  afterAddMovie,
  decrementActorBridge,
  incrementActorBridge,
  recordStartMovie,
  reverseAfterRemoveFirst,
  reverseAfterRemoveLast,
} from './profile';

function link(movieId: number, partial: Partial<ChainLink> = {}): ChainLink {
  const movie = {
    id: movieId,
    title: `M${movieId}`,
    overview: '',
    poster_path: null,
    backdrop_path: null,
    release_date: '2000-01-01',
    vote_average: 0,
    vote_count: 0,
    popularity: 0,
  };
  return {
    movie,
    connectingActorId: null,
    connectingActorName: null,
    comment: '',
    ...partial,
  };
}

describe('decrementActorBridge', () => {
  it('removes one destination id and decrements count', () => {
    let p: GamificationProfile = { ...DEFAULT_GAMIFICATION_PROFILE };
    p = incrementActorBridge(p, 1, 'A', 10);
    p = incrementActorBridge(p, 1, 'A', 20);
    p = decrementActorBridge(p, 1, 10);
    expect(p.actorBridgeCounts['1']?.count).toBe(1);
    expect(p.actorBridgeMovieIds['1']).toEqual([20]);
  });

  it('removes keys when empty', () => {
    let p = incrementActorBridge({ ...DEFAULT_GAMIFICATION_PROFILE }, 2, 'B', 99);
    p = decrementActorBridge(p, 2, 99);
    expect(p.actorBridgeCounts['2']).toBeUndefined();
    expect(p.actorBridgeMovieIds['2']).toBeUndefined();
  });
});

describe('reverseAfterRemoveLast', () => {
  it('reverses tail add including bridge and daily', () => {
    const L0 = link(1, { entryKind: 'start', loggedDate: '2025-01-01' });
    const L1 = link(2, {
      entryKind: 'append',
      connectingActorId: 9,
      connectingActorName: 'Act',
      stepDifficulty: 3,
      loggedDate: '2025-01-02',
    });
    let p: GamificationProfile = { ...DEFAULT_GAMIFICATION_PROFILE };
    const r1 = afterAddMovie(p, [L0, L1], 1);
    p = r1.profile;
    expect(p.totalLinksAddedAllTime).toBe(1);

    p = reverseAfterRemoveLast(p, [L0, L1]);
    expect(p.totalLinksAddedAllTime).toBe(0);
    expect(p.totalChallengePointsAllTime).toBe(0);
    expect(p.actorBridgeCounts['9']).toBeUndefined();
    expect(p.moviesAddedByDate['2025-01-02']).toBeUndefined();
  });
});

describe('reverseAfterRemoveFirst', () => {
  it('single link only decrements daily', () => {
    let p = recordStartMovie({ ...DEFAULT_GAMIFICATION_PROFILE }, '2025-03-01');
    const L0 = link(1, { entryKind: 'start', loggedDate: '2025-03-01' });
    p = reverseAfterRemoveFirst(p, [L0]);
    expect(p.moviesAddedByDate['2025-03-01']).toBeUndefined();
  });

  it('removing start head reverses bridge to second movie and daily on start', () => {
    const L0 = link(1, { entryKind: 'start', loggedDate: '2025-01-10' });
    const L1 = link(2, {
      entryKind: 'append',
      connectingActorId: 7,
      connectingActorName: 'X',
      stepDifficulty: 4,
      loggedDate: '2025-01-11',
    });
    let p: GamificationProfile = { ...DEFAULT_GAMIFICATION_PROFILE };
    p = afterAddMovie(p, [L0, L1], 1).profile;
    expect(p.totalLinksAddedAllTime).toBe(1);

    p = reverseAfterRemoveFirst(p, [L0, L1]);
    expect(p.totalLinksAddedAllTime).toBe(1);
    expect(p.totalChallengePointsAllTime).toBe(0);
    expect(p.actorBridgeCounts['7']).toBeUndefined();
    expect(p.moviesAddedByDate['2025-01-10']).toBeUndefined();
    expect(p.moviesAddedByDate['2025-01-11']).toBe(1);
  });

  it('removing prepended head reverses bridge to prepended id and totalLinks', () => {
    const Lprep = link(100, { entryKind: 'prepend', loggedDate: '2025-02-01' });
    const L0 = link(1, {
      entryKind: 'start',
      connectingActorId: 5,
      connectingActorName: 'Y',
      stepDifficulty: 2,
      loggedDate: '2025-01-01',
    });
    const chain = [Lprep, L0];
    let p = recordStartMovie({ ...DEFAULT_GAMIFICATION_PROFILE }, '2025-01-01');
    p = afterAddMovie(p, chain, 0).profile;
    expect(p.totalLinksAddedAllTime).toBe(1);
    expect(p.actorBridgeMovieIds['5']).toContain(100);

    p = reverseAfterRemoveFirst(p, chain);
    expect(p.totalLinksAddedAllTime).toBe(0);
    expect(p.actorBridgeCounts['5']).toBeUndefined();
    expect(p.moviesAddedByDate['2025-02-01']).toBeUndefined();
  });
});
