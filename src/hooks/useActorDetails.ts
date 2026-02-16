import { useState, useEffect } from 'react';
import type { Actor, Movie } from '../types/movie';
import { getActorDetails, getActorMovieCredits } from '../services/tmdb';

interface UseActorDetailsResult {
  actor: Actor | null;
  movies: Movie[];
  loading: boolean;
  error: string | null;
}

export function useActorDetails(personId: number | null): UseActorDetailsResult {
  const [actor, setActor] = useState<Actor | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (personId === null) {
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
  }, [personId]);

  return { actor, movies, loading, error };
}
