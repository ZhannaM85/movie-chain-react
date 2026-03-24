import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { MovieApi } from '../services/movieApi';

/**
 * When we only have a person id (e.g. bridge link lost the name), fetch display name from the API.
 */
export function useResolvedActorName(
  actorId: number | null,
  explicitName: string | null | undefined,
  api: MovieApi
): { text: string; loading: boolean } {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fetchedName, setFetchedName] = useState<string | null>(null);

  const hasExplicit = explicitName != null && String(explicitName).trim() !== '';
  const shouldFetch = actorId != null && !hasExplicit;

  useEffect(() => {
    if (!shouldFetch) {
      setFetchedName(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setFetchedName(null);
    api
      .getActorDetails(actorId)
      .then((actor) => {
        if (!cancelled) setFetchedName(actor.name);
      })
      .catch(() => {
        if (!cancelled) setFetchedName(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [actorId, shouldFetch, api, i18n.resolvedLanguage, i18n.language]);

  if (hasExplicit) {
    return { text: String(explicitName).trim(), loading: false };
  }
  if (loading) {
    return { text: '', loading: true };
  }
  if (fetchedName) {
    return { text: fetchedName, loading: false };
  }
  return { text: '', loading: false };
}
