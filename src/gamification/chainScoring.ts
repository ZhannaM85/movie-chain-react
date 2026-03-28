import type { Movie } from '../types/movie';

/** Points from movie vote_count and movie popularity (one chain step). */
export function scoreMovieContribution(movie: Movie): number {
  let score = 0;

  const votes = movie.vote_count ?? 0;
  if (votes < 200) score += 8;
  else if (votes < 2_000) score += 4;
  else if (votes < 20_000) score += 1;

  const mp = movie.popularity ?? 0;
  if (mp < 10) score += 3;
  else if (mp < 40) score += 1;

  return score;
}

/** Points from connecting actor popularity (0–10); null/invalid adds nothing. */
export function scoreActorContribution(actorPopularity: number | null): number {
  if (actorPopularity == null || !Number.isFinite(actorPopularity)) return 0;
  if (actorPopularity < 3) return 10;
  if (actorPopularity < 15) return 5;
  if (actorPopularity < 40) return 2;
  return 0;
}

/**
 * Difficulty points for one chain step (connecting actor → next movie).
 * Rewards obscure movies (few votes) and less famous actors.
 */
export function scoreChainStep(movie: Movie, actorPopularity: number | null): number {
  return scoreMovieContribution(movie) + scoreActorContribution(actorPopularity);
}
