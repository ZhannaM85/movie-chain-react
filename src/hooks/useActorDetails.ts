import { useState, useEffect } from 'react';
import type { Actor, Movie } from '../types/movie';
import { getActorDetails, getActorMovieCredits } from '../services/tmdb';
import { useTranslation } from 'react-i18next';

interface UseActorDetailsResult {
  actor: Actor | null;
  movies: Movie[];
  loading: boolean;
  error: string | null;
}

/**
 * React hook that fetches an actor and a curated list of their movies.
 *
 * @param {number | null} personId - The TMDB person identifier, or null to clear data.
 * @returns {UseActorDetailsResult} The actor details, movies, and loading/error state.
 */
export function useActorDetails(personId: number | null): UseActorDetailsResult {
  const { i18n } = useTranslation();
  const [actor, setActor] = useState<Actor | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (personId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActor(null);
      setMovies([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getActorDetails(personId), getActorMovieCredits(personId)])
      .then(([actorData, creditsData]) => {
        if (!cancelled) {
          setActor(actorData);
          const sorted = [...creditsData.cast]
            .filter((m) => m.poster_path && m.release_date)
            .sort((a, b) => b.popularity - a.popularity);
          setMovies(sorted);
        }
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
  }, [personId, i18n.resolvedLanguage, i18n.language]);

  return { actor, movies, loading, error };
}
