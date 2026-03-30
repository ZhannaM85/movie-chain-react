import { describe, expect, it } from 'vitest';
import type { ChainLink } from '../types/movie';
import { DEFAULT_GAMIFICATION_PROFILE } from './types';
import { afterAddMovie, ensureMoviesMilestoneAchievements } from './profile';

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
  it('unlocks movies_100 when total logged crosses 100', () => {
    const L0 = link(1, { entryKind: 'start', loggedDate: '2025-01-01' });
    const L1 = link(2, {
      entryKind: 'append',
      connectingActorId: 9,
      connectingActorName: 'Act',
      stepDifficulty: 1,
      loggedDate: '2025-01-02',
    });
    const base = { ...DEFAULT_GAMIFICATION_PROFILE, totalLinksAddedAllTime: 99 };
    const r = afterAddMovie(base, [L0, L1], 1);
    expect(r.profile.totalLinksAddedAllTime).toBe(100);
    expect(r.newAchievements).toContain('movies_100');
    expect(r.profile.unlockedAchievementIds).toContain('movies_100');
  });

  it('backfills movies_100 when total is already past the milestone', () => {
    const p = ensureMoviesMilestoneAchievements({
      ...DEFAULT_GAMIFICATION_PROFILE,
      totalLinksAddedAllTime: 105,
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
      unlockedAchievementIds: ['movies_100'],
    };
    const r = afterAddMovie(base, [L0, L1], 1);
    expect(r.newAchievements).not.toContain('movies_100');
  });
});
