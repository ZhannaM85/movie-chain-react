import type { Actor } from '../types/movie';
import type { GamificationProfile } from './types';

/** Include billed cast through this many rows (covers extras / minor roles). */
const MAX_CAST_PER_MOVIE = 200;

/**
 * For one movie in the user's chain, add +1 for each distinct actor in the credits
 * (each actor counts once per movie). Idempotent per movie id.
 */
export function recordCastAppearancesForMovie(
  profile: GamificationProfile,
  movieId: number,
  cast: Actor[]
): GamificationProfile {
  const mkey = String(movieId);
  if (profile.castAppearanceMoviesSeen[mkey]) {
    return profile;
  }

  const slice = cast.slice(0, MAX_CAST_PER_MOVIE);
  const seenInMovie = new Set<number>();
  const nextCounts = { ...profile.actorCastAppearanceCounts };

  for (const actor of slice) {
    if (!actor?.id || seenInMovie.has(actor.id)) continue;
    seenInMovie.add(actor.id);
    const key = String(actor.id);
    const prev = nextCounts[key];
    nextCounts[key] = {
      name: actor.name,
      count: (prev?.count ?? 0) + 1,
    };
  }

  return {
    ...profile,
    actorCastAppearanceCounts: nextCounts,
    castAppearanceMoviesSeen: { ...profile.castAppearanceMoviesSeen, [mkey]: true },
  };
}
