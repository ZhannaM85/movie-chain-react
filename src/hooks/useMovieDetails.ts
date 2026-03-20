import { useState, useEffect } from 'react';
import type { Movie, MovieCredits } from '../types/movie';
import { getMovieDetails } from '../services/tmdb';
import { useTranslation } from 'react-i18next';

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
  const { i18n } = useTranslation();
  const [movie, setMovie] = useState<(Movie & { credits: MovieCredits }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (movieId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [movieId, i18n.resolvedLanguage, i18n.language]);

  return { movie, loading, error };
}
