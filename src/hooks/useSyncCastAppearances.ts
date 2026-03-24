import { useEffect } from 'react';
import type { Actor } from '../types/movie';
import { useChainContext } from '../context/ChainContext';

/**
 * When credits load for a movie that is in the chain, merge full cast into appearance stats (once per movie).
 * Pass {@link creditsMovieId} from {@link MovieCredits.id} so we never record one film's cast under another's id (stale hook state).
 */
export function useSyncCastAppearances(
  movieId: number | null | undefined,
  cast: Actor[] | undefined,
  isInChain: boolean,
  creditsMovieId?: number | null
) {
  const { aggregateCastAppearancesForMovie } = useChainContext();

  useEffect(() => {
    if (!isInChain || movieId == null || !cast?.length) return;
    if (creditsMovieId != null && creditsMovieId !== movieId) return;
    aggregateCastAppearancesForMovie(movieId, cast);
  }, [movieId, isInChain, cast, creditsMovieId, aggregateCastAppearancesForMovie]);
}
