import { describe, it, expect } from 'vitest';
import { recordCastAppearancesForMovie } from './castAppearances';
import { DEFAULT_GAMIFICATION_PROFILE } from './types';
import type { Actor } from '../types/movie';

const actor = (id: number, name: string): Actor => ({
  id,
  name,
  profile_path: null,
  popularity: 1,
});

describe('recordCastAppearancesForMovie', () => {
  it('counts each actor once per movie and is idempotent', () => {
    const cast: Actor[] = [
      actor(1, 'A'),
      actor(2, 'B'),
      actor(1, 'A'),
    ];
    let p = recordCastAppearancesForMovie(DEFAULT_GAMIFICATION_PROFILE, 99, cast);
    expect(p.actorCastAppearanceCounts['1']?.count).toBe(1);
    expect(p.actorCastAppearanceCounts['2']?.count).toBe(1);
    expect(p.castAppearanceMoviesSeen['99']).toBe(true);

    const p2 = recordCastAppearancesForMovie(p, 99, cast);
    expect(p2).toBe(p);
  });

  it('increments across different movies', () => {
    const cast: Actor[] = [actor(1, 'A')];
    let p = recordCastAppearancesForMovie(DEFAULT_GAMIFICATION_PROFILE, 99, cast);
    p = recordCastAppearancesForMovie(p, 100, cast);
    expect(p.actorCastAppearanceCounts['1']?.count).toBe(2);
  });
});
