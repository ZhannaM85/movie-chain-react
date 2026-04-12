import { useCallback, useState } from 'react';
import {
  loadChainUiPreferences,
  normalizeChainUiPickModes,
  saveChainUiPreferences,
  type ChainUiPreferences,
} from '../lib/chainUiPreferences';

/**
 * Persisted toggles for chain picking UI (strict list order, random single pick, etc.).
 * Mutual exclusion per axis is enforced in the stats UI (opposite switch disabled).
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

  const setRandomSinglePickActors = useCallback((value: boolean) => {
    setPrefs((p) => {
      const next = normalizeChainUiPickModes({ ...p, randomSinglePickActors: value });
      saveChainUiPreferences(next);
      return next;
    });
  }, []);

  const setRandomSinglePickMovies = useCallback((value: boolean) => {
    setPrefs((p) => {
      const next = normalizeChainUiPickModes({ ...p, randomSinglePickMovies: value });
      saveChainUiPreferences(next);
      return next;
    });
  }, []);

  const setRandomSinglePickLimitToTop12 = useCallback((value: boolean) => {
    setPrefs((p) => {
      const canUse = p.randomSinglePickActors || p.randomSinglePickMovies;
      const next = { ...p, randomSinglePickLimitToTop12: canUse ? value : false };
      saveChainUiPreferences(next);
      return next;
    });
  }, []);

  const setCrossListMemory = useCallback((value: boolean) => {
    setPrefs((p) => {
      const next = { ...p, crossListMemory: value };
      saveChainUiPreferences(next);
      return next;
    });
  }, []);

  return {
    strictListOrderActors: prefs.strictListOrderActors,
    strictListOrderMovies: prefs.strictListOrderMovies,
    randomSinglePickActors: prefs.randomSinglePickActors,
    randomSinglePickMovies: prefs.randomSinglePickMovies,
    randomSinglePickLimitToTop12: prefs.randomSinglePickLimitToTop12,
    crossListMemory: prefs.crossListMemory,
    setStrictListOrderActors,
    setStrictListOrderMovies,
    setRandomSinglePickActors,
    setRandomSinglePickMovies,
    setRandomSinglePickLimitToTop12,
    setCrossListMemory,
  };
}
