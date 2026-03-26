import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { MovieApi } from '../services/movieApi';

/**
 * Title for the active UI language. Persisted chain links store a snapshot; this refetches a light
 * locale snapshot so titles match after the user changes language.
 */
export function useResolvedMovieTitle(
  movieId: number,
  fallbackTitle: string,
  api: MovieApi
): { title: string; loading: boolean } {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fetchedTitle, setFetchedTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchedTitle(null);
    api
      .getMovieLocaleSnapshot(movieId)
      .then((m) => {
        if (!cancelled) setFetchedTitle(m.title);
      })
      .catch(() => {
        if (!cancelled) setFetchedTitle(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [movieId, api, i18n.resolvedLanguage, i18n.language]);

  if (loading) {
    return { title: '', loading: true };
  }
  if (fetchedTitle) {
    return { title: fetchedTitle, loading: false };
  }
  return { title: fallbackTitle, loading: false };
}
