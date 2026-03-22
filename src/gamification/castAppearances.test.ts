import { describe, it, expect } from 'vitest';
import {
  recordCastAppearancesForMovie,
  rebuildActorCastAppearanceCounts,
} from './castAppearances';
import { DEFAULT_GAMIFICATION_PROFILE } from './types';
import type { Actor, ChainLink } from '../types/movie';

const actor = (id: number, name: string): Actor => ({
  id,
  name,
  profile_path: null,
  popularity: 1,
});

const minimalMovie = (id: number) => ({
  id,
  title: 'T',
  overview: '',
  poster_path: null,
  backdrop_path: null,
  release_date: '',
  vote_average: 0,
  vote_count: 0,
  popularity: 0,
});

const linkForMovie = (id: number): ChainLink => ({
  movie: minimalMovie(id),
  connectingActorId: null,
  connectingActorName: null,
  comment: '',
});

describe('recordCastAppearancesForMovie', () => {
  it('counts each actor once per movie and is idempotent', () => {
    const cast: Actor[] = [
      actor(1, 'A'),
      actor(2, 'B'),
      actor(1, 'A'),
    ];
    const links = [linkForMovie(99)];
    let p = recordCastAppearancesForMovie(DEFAULT_GAMIFICATION_PROFILE, 99, cast, links);
    expect(p.actorCastAppearanceCounts['1']?.count).toBe(1);
    expect(p.actorCastAppearanceCounts['2']?.count).toBe(1);
    expect(p.castAppearanceMoviesSeen['99']).toBe(true);

    const p2 = recordCastAppearancesForMovie(p, 99, cast, links);
    expect(p2).toBe(p);
  });

  it('increments across different movies in the current chain', () => {
    const cast: Actor[] = [actor(1, 'A')];
    const linksTwo = [linkForMovie(99), linkForMovie(100)];
    let p = recordCastAppearancesForMovie(DEFAULT_GAMIFICATION_PROFILE, 99, cast, [linkForMovie(99)]);
    p = recordCastAppearancesForMovie(p, 100, cast, linksTwo);
    expect(p.actorCastAppearanceCounts['1']?.count).toBe(2);
  });

  it('does not count a movie that is no longer in the chain', () => {
    const cast: Actor[] = [actor(1, 'A')];
    const linksTwo = [linkForMovie(99), linkForMovie(100)];
    let p = recordCastAppearancesForMovie(DEFAULT_GAMIFICATION_PROFILE, 99, cast, [linkForMovie(99)]);
    p = recordCastAppearancesForMovie(p, 100, cast, linksTwo);
    expect(p.actorCastAppearanceCounts['1']?.count).toBe(2);

    const afterRemove = rebuildActorCastAppearanceCounts(p, [linkForMovie(100)]);
    expect(afterRemove.actorCastAppearanceCounts['1']?.count).toBe(1);
  });
});

describe('rebuildActorCastAppearanceCounts', () => {
  it('leaves profile unchanged when there are no cast snapshots', () => {
    const p = { ...DEFAULT_GAMIFICATION_PROFILE };
    const out = rebuildActorCastAppearanceCounts(p, [linkForMovie(1)]);
    expect(out).toBe(p);
  });
});
