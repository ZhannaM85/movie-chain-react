import type { Movie } from '../types/movie';

/**
 * Difficulty points for one chain step (connecting actor → next movie).
 * Rewards obscure movies (few votes) and less famous actors.
 */
export function scoreChainStep(movie: Movie, actorPopularity: number | null): number {
  let score = 0;

  const votes = movie.vote_count ?? 0;
  if (votes < 200) score += 8;
  else if (votes < 2_000) score += 4;
  else if (votes < 20_000) score += 1;

  const mp = movie.popularity ?? 0;
  if (mp < 10) score += 3;
  else if (mp < 40) score += 1;

  if (actorPopularity != null && Number.isFinite(actorPopularity)) {
    if (actorPopularity < 3) score += 10;
    else if (actorPopularity < 15) score += 5;
    else if (actorPopularity < 40) score += 2;
  }

  return score;
}
