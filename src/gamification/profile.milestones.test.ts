import { describe, expect, it } from 'vitest';
import type { ChainLink } from '../types/movie';
import { DEFAULT_GAMIFICATION_PROFILE } from './types';
import {
  acknowledgeMoviesMilestoneModal,
  afterAddMovie,
  ensureMoviesMilestoneAchievements,
  getPendingMoviesMilestoneModal,
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

describe('afterAddMovie movies milestones', () => {
  it('unlocks movies_100 when longest chain first reaches 100', () => {
    const links: ChainLink[] = [];
    for (let i = 0; i < 100; i++) {
      links.push(
        link(i + 1, {
          entryKind: i === 0 ? 'start' : 'append',
          loggedDate: '2025-01-01',
          connectingActorId: i === 0 ? null : 1,
          connectingActorName: i === 0 ? null : 'A',
          stepDifficulty: i === 0 ? undefined : 1,
        })
      );
    }
    const base = { ...DEFAULT_GAMIFICATION_PROFILE, longestChainEver: 99, totalLinksAddedAllTime: 98 };
    const r = afterAddMovie(base, links, 99);
    expect(r.profile.longestChainEver).toBe(100);
    expect(r.newAchievements).toContain('movies_100');
    expect(r.profile.unlockedAchievementIds).toContain('movies_100');
  });

  it('backfills movies_100 when longest chain is already past the milestone', () => {
    const p = ensureMoviesMilestoneAchievements({
      ...DEFAULT_GAMIFICATION_PROFILE,
      longestChainEver: 111,
      totalLinksAddedAllTime: 0,
      unlockedAchievementIds: [],
    });
    expect(p.unlockedAchievementIds).toContain('movies_100');
    expect(p.unlockedAchievementIds).not.toContain('movies_200');
  });

  it('does not unlock twice at 100', () => {
    const L0 = link(1, { entryKind: 'start', loggedDate: '2025-01-01' });
    const L1 = link(2, {
      entryKind: 'append',
      connectingActorId: 9,
      connectingActorName: 'Act',
      stepDifficulty: 1,
      loggedDate: '2025-01-02',
    });
    const base = {
      ...DEFAULT_GAMIFICATION_PROFILE,
      totalLinksAddedAllTime: 100,
      longestChainEver: 100,
      unlockedAchievementIds: ['movies_100'],
    };
    const r = afterAddMovie(base, [L0, L1], 1);
    expect(r.newAchievements).not.toContain('movies_100');
  });
});

describe('movies milestone modal bookkeeping', () => {
  it('returns the lowest unacknowledged milestone up to the current score', () => {
    expect(
      getPendingMoviesMilestoneModal({
        ...DEFAULT_GAMIFICATION_PROFILE,
        longestChainEver: 111,
        moviesMilestoneModalsAcknowledged: [],
      })
    ).toBe(100);
    expect(
      getPendingMoviesMilestoneModal({
        ...DEFAULT_GAMIFICATION_PROFILE,
        longestChainEver: 111,
        moviesMilestoneModalsAcknowledged: [100],
      })
    ).toBeNull();
  });

  it('queues 200 after 100 is acknowledged when score qualifies', () => {
    const p1 = acknowledgeMoviesMilestoneModal(
      {
        ...DEFAULT_GAMIFICATION_PROFILE,
        longestChainEver: 250,
        moviesMilestoneModalsAcknowledged: [],
      },
      100
    );
    expect(getPendingMoviesMilestoneModal(p1)).toBe(200);
    const p2 = acknowledgeMoviesMilestoneModal(p1, 200);
    expect(getPendingMoviesMilestoneModal(p2)).toBeNull();
  });
});
