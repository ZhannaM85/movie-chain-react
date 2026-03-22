import { useEffect } from 'react';
import type { Actor } from '../types/movie';
import { useChainContext } from '../context/ChainContext';

/**
 * When credits load for a movie that is in the chain, merge full cast into appearance stats (once per movie).
 */
export function useSyncCastAppearances(
  movieId: number | null | undefined,
  cast: Actor[] | undefined,
  isInChain: boolean
) {
  const { aggregateCastAppearancesForMovie } = useChainContext();

  useEffect(() => {
    if (!isInChain || movieId == null || !cast?.length) return;
    aggregateCastAppearancesForMovie(movieId, cast);
  }, [movieId, isInChain, cast, aggregateCastAppearancesForMovie]);
}
