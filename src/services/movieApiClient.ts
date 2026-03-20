import type { MovieApi, MovieSource } from './movieApi';
import { createTmdbApi } from './tmdbMovieApi';
import { createKinopoiskApi } from './kinopoisk';

const STORAGE_KEY = 'movie-api-source';
const PREFER_KINOPOISK_KEY = 'movie-api-prefer-kinopoisk';
const CHAIN_STORAGE_KEY = 'movie-chain-state';

let cachedApi: MovieApi | null = null;
const apiBySource: { tmdb?: MovieApi; kinopoisk?: MovieApi } = {};

function getChainSourceFromStorage(): MovieSource | null {
  try {
    const raw = localStorage.getItem(CHAIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { source?: MovieSource; links?: unknown[] };
    if (!parsed.links?.length) return null;
    return parsed.source ?? 'tmdb';
  } catch {
    return null;
  }
}

export function getPreferKinopoisk(): boolean {
  try {
    return localStorage.getItem(PREFER_KINOPOISK_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setPreferKinopoisk(value: boolean): void {
  try {
    localStorage.setItem(PREFER_KINOPOISK_KEY, String(value));
  } catch {
    // ignore
  }
}

/**
 * Resolves the active movie API with defensive logic:
 * - If user has TMDB entries in localStorage and TMDB is available → use TMDB
 * - If user has Kinopoisk entries in localStorage and TMDB is available → use Kinopoisk
 * - If TMDB is not available → use Kinopoisk
 * - Toggle overrides only when there is no persisted chain.
 *
 * @returns {Promise<MovieApi>} The active API implementation.
 */
export async function getMovieApi(): Promise<MovieApi> {
  if (cachedApi) return cachedApi;

  const chainSource = getChainSourceFromStorage();
  const preferKinopoisk = getPreferKinopoisk();
  const tmdbKey = import.meta.env.VITE_TMDB_API_KEY as string;
  const kinopoiskKey = import.meta.env.VITE_KINOPOISK_API_KEY as string;

  // User has Kinopoisk entries in localStorage → use Kinopoisk (even if TMDB is available)
  if (chainSource === 'kinopoisk' && kinopoiskKey) {
    cachedApi = getMovieApiForSource('kinopoisk');
    sessionStorage.setItem(STORAGE_KEY, 'kinopoisk');
    return cachedApi;
  }

  // User has TMDB entries in localStorage → use TMDB (verify it works)
  if (chainSource === 'tmdb' && tmdbKey) {
    try {
      cachedApi = getMovieApiForSource('tmdb');
      await cachedApi.getTrendingMovies();
      sessionStorage.setItem(STORAGE_KEY, 'tmdb');
      return cachedApi;
    } catch {
      if (kinopoiskKey) {
        cachedApi = getMovieApiForSource('kinopoisk');
        sessionStorage.setItem(STORAGE_KEY, 'kinopoisk');
        return cachedApi;
      }
      throw new Error(
        'TMDB is unavailable and your chain uses TMDB data. Add VITE_KINOPOISK_API_KEY for fallback.'
      );
    }
  }

  // No chain: TMDB not available → use Kinopoisk
  if (!tmdbKey && kinopoiskKey) {
    cachedApi = getMovieApiForSource('kinopoisk');
    sessionStorage.setItem(STORAGE_KEY, 'kinopoisk');
    return cachedApi;
  }

  // No chain: user prefers Kinopoisk (toggle on) → use Kinopoisk
  if (preferKinopoisk && kinopoiskKey) {
    cachedApi = getMovieApiForSource('kinopoisk');
    sessionStorage.setItem(STORAGE_KEY, 'kinopoisk');
    return cachedApi;
  }

  // No chain: try TMDB first, fallback to Kinopoisk if blocked
  if (tmdbKey) {
    try {
      cachedApi = getMovieApiForSource('tmdb');
      await cachedApi.getTrendingMovies();
      sessionStorage.setItem(STORAGE_KEY, 'tmdb');
      return cachedApi;
    } catch {
      if (kinopoiskKey) {
        cachedApi = getMovieApiForSource('kinopoisk');
        sessionStorage.setItem(STORAGE_KEY, 'kinopoisk');
        return cachedApi;
      }
    }
  }

  if (kinopoiskKey) {
    cachedApi = getMovieApiForSource('kinopoisk');
    sessionStorage.setItem(STORAGE_KEY, 'kinopoisk');
    return cachedApi;
  }

  if (tmdbKey) {
    throw new Error(
      'TMDB is unavailable in your region. Enable Kinopoisk in settings or add VITE_KINOPOISK_API_KEY to .env.'
    );
  }
  throw new Error(
    'No API key configured. Set VITE_TMDB_API_KEY or VITE_KINOPOISK_API_KEY in .env.'
  );
}

/**
 * Returns the API for a specific source (used when loading persisted chains).
 * Caches instances by source so the same reference is returned across renders,
 * preventing unnecessary effect re-runs in hooks that depend on the API.
 *
 * @param {MovieSource} source - The data source to use.
 * @returns {MovieApi} The API implementation.
 */
export function getMovieApiForSource(source: MovieSource): MovieApi {
  if (source === 'kinopoisk') {
    if (!apiBySource.kinopoisk) apiBySource.kinopoisk = createKinopoiskApi();
    return apiBySource.kinopoisk;
  }
  if (!apiBySource.tmdb) apiBySource.tmdb = createTmdbApi();
  return apiBySource.tmdb;
}

/**
 * Clears the cached API and session storage. Call when user wants to retry TMDB.
 */
export function resetMovieApiCache(): void {
  cachedApi = null;
  sessionStorage.removeItem(STORAGE_KEY);
}
