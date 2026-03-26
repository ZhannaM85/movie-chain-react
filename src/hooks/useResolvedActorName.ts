import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { MovieApi } from '../services/movieApi';

/**
 * Resolves a bridge actor label for the current UI language.
 * When we have a person id, always fetch from the API (TMDB/KP requests use i18n locale) so a name
 * saved while another language was active does not stick after the user switches languages.
 * `explicitName` is only a fallback when there is no id or the fetch fails.
 */
export function useResolvedActorName(
  actorId: number | null,
  explicitName: string | null | undefined,
  api: MovieApi
): { text: string; loading: boolean } {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fetchedName, setFetchedName] = useState<string | null>(null);

  const trimmedExplicit =
    explicitName != null && String(explicitName).trim() !== ''
      ? String(explicitName).trim()
      : null;

  const shouldFetch = actorId != null;

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

  if (!shouldFetch) {
    return { text: trimmedExplicit ?? '', loading: false };
  }
  if (loading) {
    return { text: '', loading: true };
  }
  if (fetchedName) {
    return { text: fetchedName, loading: false };
  }
  return { text: trimmedExplicit ?? '', loading: false };
}
