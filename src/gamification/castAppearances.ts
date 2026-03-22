import type { Actor, ChainLink } from '../types/movie';
import type { GamificationProfile } from './types';

/** Include billed cast through this many rows (covers extras / minor roles). */
const MAX_CAST_PER_MOVIE = 200;

/**
 * Recomputes full-cast appearance counts from {@link GamificationProfile.movieCastByMovie}
 * and the **current** chain only. Movies removed from the chain no longer contribute.
 */
export function rebuildActorCastAppearanceCounts(
  profile: GamificationProfile,
  links: ChainLink[]
): GamificationProfile {
  const snap = profile.movieCastByMovie ?? {};
  if (Object.keys(snap).length === 0) {
    return profile;
  }

  const byActor: Record<string, { name: string; count: number }> = {};
  for (const link of links) {
    const mid = String(link.movie.id);
    const actors = snap[mid];
    if (!actors) continue;
    for (const [actorIdStr, name] of Object.entries(actors)) {
      const prev = byActor[actorIdStr];
      byActor[actorIdStr] = {
        name: prev?.name ?? name,
        count: (prev?.count ?? 0) + 1,
      };
    }
  }

  if (JSON.stringify(byActor) === JSON.stringify(profile.actorCastAppearanceCounts)) {
    return profile;
  }

  return { ...profile, actorCastAppearanceCounts: byActor };
}

/**
 * For one movie in the user's chain, store its full cast snapshot (each actor once per movie).
 * Idempotent per movie id. Counts are derived from snapshots + current {@link links} only.
 */
export function recordCastAppearancesForMovie(
  profile: GamificationProfile,
  movieId: number,
  cast: Actor[],
  links: ChainLink[]
): GamificationProfile {
  const mkey = String(movieId);
  if (profile.castAppearanceMoviesSeen[mkey]) {
    return profile;
  }

  const slice = cast.slice(0, MAX_CAST_PER_MOVIE);
  const seenInMovie = new Set<number>();
  const actorsForMovie: Record<string, string> = {};

  for (const actor of slice) {
    if (!actor?.id || seenInMovie.has(actor.id)) continue;
    seenInMovie.add(actor.id);
    actorsForMovie[String(actor.id)] = actor.name;
  }

  const next: GamificationProfile = {
    ...profile,
    movieCastByMovie: {
      ...(profile.movieCastByMovie ?? {}),
      [mkey]: actorsForMovie,
    },
    castAppearanceMoviesSeen: { ...profile.castAppearanceMoviesSeen, [mkey]: true },
  };

  return rebuildActorCastAppearanceCounts(next, links);
}
