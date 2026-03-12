import { useState, useEffect } from 'react';
import type { Movie, MovieCredits } from '../types/movie';
import { getMovieDetails } from '../services/tmdb';

interface UseMovieDetailsResult {
  movie: (Movie & { credits: MovieCredits }) | null;
  loading: boolean;
  error: string | null;
}

/**
 * React hook that fetches detailed information and credits for a movie.
 *
 * @param {number | null} movieId - The TMDB movie identifier, or null to clear data.
 * @returns {UseMovieDetailsResult} The movie with credits plus loading and error state.
 */
export function useMovieDetails(movieId: number | null): UseMovieDetailsResult {
  const [movie, setMovie] = useState<(Movie & { credits: MovieCredits }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (movieId === null) {
      setMovie(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getMovieDetails(movieId)
      .then((data) => {
        if (!cancelled) setMovie(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [movieId]);

  return { movie, loading, error };
}
