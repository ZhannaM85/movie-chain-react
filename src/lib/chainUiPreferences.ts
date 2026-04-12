/** localStorage key for chain UI toggles (strict list order, etc.). */
export const CHAIN_UI_PREFERENCES_STORAGE_KEY = 'movie-chain-ui-v1';

export interface ChainUiPreferences {
  strictListOrderActors: boolean;
  strictListOrderMovies: boolean;
  /** Only one randomly chosen eligible actor is clickable per pick-actor step. */
  randomSinglePickActors: boolean;
  /** Only one randomly chosen eligible movie is clickable per pick-movie step. */
  randomSinglePickMovies: boolean;
  /**
   * When true, random single pick only draws from the first 12 billing cast slots / 12 eligible movies.
   * When false, the full eligible lists are used (full-access randomizer).
   */
  randomSinglePickLimitToTop12: boolean;
}

export const DEFAULT_CHAIN_UI_PREFERENCES: ChainUiPreferences = {
  strictListOrderActors: false,
  strictListOrderMovies: false,
  randomSinglePickActors: false,
  randomSinglePickMovies: false,
  randomSinglePickLimitToTop12: true,
};

/**
 * Legacy / migration: if both modes were true for an axis (should not happen with UI),
 * keep random and clear strict so stored prefs stay consistent.
 */
export function normalizeChainUiPickModes(prefs: ChainUiPreferences): ChainUiPreferences {
  return {
    ...prefs,
    strictListOrderActors: prefs.strictListOrderActors && !prefs.randomSinglePickActors,
    strictListOrderMovies: prefs.strictListOrderMovies && !prefs.randomSinglePickMovies,
  };
}

export function loadChainUiPreferences(): ChainUiPreferences {
  try {
    const raw = localStorage.getItem(CHAIN_UI_PREFERENCES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CHAIN_UI_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<ChainUiPreferences>;
    const merged: ChainUiPreferences = {
      strictListOrderActors:
        typeof parsed.strictListOrderActors === 'boolean'
          ? parsed.strictListOrderActors
          : DEFAULT_CHAIN_UI_PREFERENCES.strictListOrderActors,
      strictListOrderMovies:
        typeof parsed.strictListOrderMovies === 'boolean'
          ? parsed.strictListOrderMovies
          : DEFAULT_CHAIN_UI_PREFERENCES.strictListOrderMovies,
      randomSinglePickActors:
        typeof parsed.randomSinglePickActors === 'boolean'
          ? parsed.randomSinglePickActors
          : DEFAULT_CHAIN_UI_PREFERENCES.randomSinglePickActors,
      randomSinglePickMovies:
        typeof parsed.randomSinglePickMovies === 'boolean'
          ? parsed.randomSinglePickMovies
          : DEFAULT_CHAIN_UI_PREFERENCES.randomSinglePickMovies,
      randomSinglePickLimitToTop12:
        typeof parsed.randomSinglePickLimitToTop12 === 'boolean'
          ? parsed.randomSinglePickLimitToTop12
          : DEFAULT_CHAIN_UI_PREFERENCES.randomSinglePickLimitToTop12,
    };
    const normalized = normalizeChainUiPickModes(merged);
    if (JSON.stringify(merged) !== JSON.stringify(normalized)) {
      saveChainUiPreferences(normalized);
    }
    return normalized;
  } catch {
    return { ...DEFAULT_CHAIN_UI_PREFERENCES };
  }
}

export function saveChainUiPreferences(next: ChainUiPreferences): void {
  localStorage.setItem(CHAIN_UI_PREFERENCES_STORAGE_KEY, JSON.stringify(next));
}
