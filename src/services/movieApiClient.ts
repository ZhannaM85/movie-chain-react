import type { MovieApi, MovieSource } from './movieApi';
import { createTmdbApi } from './tmdbMovieApi';
import { createKinopoiskApi } from './kinopoisk';

/**
 * Set to `true` to restore automatic Kinopoisk when TMDB is missing or unreachable.
 * When `false`, TMDB is required; failures surface as service-unavailable (refresh to retry).
 */
export const KINOPOISK_FALLBACK_ENABLED = false;

/** Thrown when TMDB is unreachable or errors; map to i18n in UI. */
export const MOVIE_API_ERR_SERVICE_UNAVAILABLE = 'MOVIE_API_SERVICE_UNAVAILABLE';

/** Thrown when VITE_TMDB_API_KEY is missing but TMDB is required. */
export const MOVIE_API_ERR_NO_TMDB_CONFIGURED = 'MOVIE_API_NO_TMDB_CONFIGURED';

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
 * - Persisted Kinopoisk chain + Kinopoisk key → Kinopoisk (same IDs as stored chain).
 * - Otherwise TMDB is required when `KINOPOISK_FALLBACK_ENABLED` is false.
 * - When fallback is enabled: TMDB first, then Kinopoisk if configured.
 *
 * @returns {Promise<MovieApi>} The active API implementation.
 */
export async function getMovieApi(): Promise<MovieApi> {
  if (cachedApi) return cachedApi;

  const chainSource = getChainSourceFromStorage();
  const preferKinopoisk = getPreferKinopoisk();
  const tmdbKey = import.meta.env.VITE_TMDB_API_KEY as string;
  const kinopoiskKey = import.meta.env.VITE_KINOPOISK_API_KEY as string;
  const fallback = KINOPOISK_FALLBACK_ENABLED;

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
      if (fallback && kinopoiskKey) {
        cachedApi = getMovieApiForSource('kinopoisk');
        sessionStorage.setItem(STORAGE_KEY, 'kinopoisk');
        return cachedApi;
      }
      throw new Error(MOVIE_API_ERR_SERVICE_UNAVAILABLE);
    }
  }

  // Kinopoisk-only when no TMDB key (optional fallback mode)
  if (!tmdbKey && kinopoiskKey) {
    if (fallback) {
      cachedApi = getMovieApiForSource('kinopoisk');
      sessionStorage.setItem(STORAGE_KEY, 'kinopoisk');
      return cachedApi;
    }
    throw new Error(MOVIE_API_ERR_NO_TMDB_CONFIGURED);
  }

  // User prefers Kinopoisk (toggle on) → use Kinopoisk
  if (fallback && preferKinopoisk && kinopoiskKey) {
    cachedApi = getMovieApiForSource('kinopoisk');
    sessionStorage.setItem(STORAGE_KEY, 'kinopoisk');
    return cachedApi;
  }

  // Try TMDB first; optional Kinopoisk fallback
  if (tmdbKey) {
    try {
      cachedApi = getMovieApiForSource('tmdb');
      await cachedApi.getTrendingMovies();
      sessionStorage.setItem(STORAGE_KEY, 'tmdb');
      return cachedApi;
    } catch {
      if (fallback && kinopoiskKey) {
        cachedApi = getMovieApiForSource('kinopoisk');
        sessionStorage.setItem(STORAGE_KEY, 'kinopoisk');
        return cachedApi;
      }
      throw new Error(MOVIE_API_ERR_SERVICE_UNAVAILABLE);
    }
  }

  if (fallback && kinopoiskKey) {
    cachedApi = getMovieApiForSource('kinopoisk');
    sessionStorage.setItem(STORAGE_KEY, 'kinopoisk');
    return cachedApi;
  }

  if (tmdbKey) {
    throw new Error(MOVIE_API_ERR_SERVICE_UNAVAILABLE);
  }
  throw new Error(MOVIE_API_ERR_NO_TMDB_CONFIGURED);
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
