import { useState, useEffect } from 'react';
import type { Movie, MovieCredits } from '../types/movie';
import type { MovieApi } from '../services/movieApi';
import { useTranslation } from 'react-i18next';

interface UseMovieDetailsResult {
  movie: (Movie & { credits: MovieCredits }) | null;
  loading: boolean;
  error: string | null;
}

/**
 * React hook that fetches detailed information and credits for a movie.
 *
 * @param {number | null} movieId - The movie identifier.
 * @param {MovieApi} api - The movie API to use (TMDB or Kinopoisk).
 * @returns {UseMovieDetailsResult} The movie with credits plus loading and error state.
 */
export function useMovieDetails(movieId: number | null, api: MovieApi): UseMovieDetailsResult {
  const { i18n } = useTranslation();
  const [movie, setMovie] = useState<(Movie & { credits: MovieCredits }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (movieId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMovie(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    // Drop previous film immediately so callers never merge credits with a stale id (race when navigating between movies).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMovie(null);
    setLoading(true);
    setError(null);

    api
      .getMovieDetails(movieId)
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
  }, [movieId, api, i18n.resolvedLanguage, i18n.language]);

  const movieMatchesId =
    movie != null && movieId != null && movie.id === movieId;
  const movieForUi = movieMatchesId ? movie : null;

  return { movie: movieForUi, loading, error };
}
