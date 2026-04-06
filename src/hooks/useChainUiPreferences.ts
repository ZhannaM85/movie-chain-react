import { useCallback, useState } from 'react';
import {
  loadChainUiPreferences,
  saveChainUiPreferences,
  type ChainUiPreferences,
} from '../lib/chainUiPreferences';

/**
 * Persisted toggles for strict list-order picking (actors / movies).
 */
export function useChainUiPreferences() {
  const [prefs, setPrefs] = useState<ChainUiPreferences>(() => loadChainUiPreferences());

  const setStrictListOrderActors = useCallback((value: boolean) => {
    setPrefs((p) => {
      const next = { ...p, strictListOrderActors: value };
      saveChainUiPreferences(next);
      return next;
    });
  }, []);

  const setStrictListOrderMovies = useCallback((value: boolean) => {
    setPrefs((p) => {
      const next = { ...p, strictListOrderMovies: value };
      saveChainUiPreferences(next);
      return next;
    });
  }, []);

  return {
    strictListOrderActors: prefs.strictListOrderActors,
    strictListOrderMovies: prefs.strictListOrderMovies,
    setStrictListOrderActors,
    setStrictListOrderMovies,
  };
}
