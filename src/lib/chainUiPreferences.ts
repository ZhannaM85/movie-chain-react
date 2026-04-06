/** localStorage key for chain UI toggles (strict list order, etc.). */
export const CHAIN_UI_PREFERENCES_STORAGE_KEY = 'movie-chain-ui-v1';

export interface ChainUiPreferences {
  strictListOrderActors: boolean;
  strictListOrderMovies: boolean;
}

export const DEFAULT_CHAIN_UI_PREFERENCES: ChainUiPreferences = {
  strictListOrderActors: false,
  strictListOrderMovies: false,
};

export function loadChainUiPreferences(): ChainUiPreferences {
  try {
    const raw = localStorage.getItem(CHAIN_UI_PREFERENCES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CHAIN_UI_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<ChainUiPreferences>;
    return {
      strictListOrderActors:
        typeof parsed.strictListOrderActors === 'boolean'
          ? parsed.strictListOrderActors
          : DEFAULT_CHAIN_UI_PREFERENCES.strictListOrderActors,
      strictListOrderMovies:
        typeof parsed.strictListOrderMovies === 'boolean'
          ? parsed.strictListOrderMovies
          : DEFAULT_CHAIN_UI_PREFERENCES.strictListOrderMovies,
    };
  } catch {
    return { ...DEFAULT_CHAIN_UI_PREFERENCES };
  }
}

export function saveChainUiPreferences(next: ChainUiPreferences): void {
  localStorage.setItem(CHAIN_UI_PREFERENCES_STORAGE_KEY, JSON.stringify(next));
}
