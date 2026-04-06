import type { Actor, Movie } from '../types/movie';

/**
 * First cast member in billing order who is not already used as a bridge actor.
 * If every listed actor is bridge-used, returns null.
 */
export function findFirstSelectableActorId(
  cast: Pick<Actor, 'id'>[],
  bridgeActorIds: Set<number>
): number | null {
  for (const a of cast) {
    if (!bridgeActorIds.has(a.id)) return a.id;
  }
  return null;
}

/**
 * First movie in the given order that is not already in the chain.
 */
export function findFirstSelectableMovieId(
  orderedMovies: Pick<Movie, 'id'>[],
  chainMovieIds: Set<number>
): number | null {
  for (const m of orderedMovies) {
    if (!chainMovieIds.has(m.id)) return m.id;
  }
  return null;
}
