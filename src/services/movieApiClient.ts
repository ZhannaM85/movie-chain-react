import type { MovieApi, MovieSource } from './movieApi';
import { createTmdbApi } from './tmdbMovieApi';
import { createKinopoiskApi } from './kinopoisk';

const STORAGE_KEY = 'movie-api-source';
const PREFER_KINOPOISK_KEY = 'movie-api-prefer-kinopoisk';

let cachedApi: MovieApi | null = null;
const apiBySource: { tmdb?: MovieApi; kinopoisk?: MovieApi } = {};

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
 * Resolves the active movie API. When user has toggled "Use Kinopoisk" on,
 * uses Kinopoisk. When off (default), uses TMDB with fallback to Kinopoisk if blocked.
 *
 * @returns {Promise<MovieApi>} The active API implementation.
 */
export async function getMovieApi(): Promise<MovieApi> {
  if (cachedApi) return cachedApi;

  const preferKinopoisk = getPreferKinopoisk();
  const tmdbKey = import.meta.env.VITE_TMDB_API_KEY as string;
  const kinopoiskKey = import.meta.env.VITE_KINOPOISK_API_KEY as string;

  if (preferKinopoisk && kinopoiskKey) {
    cachedApi = getMovieApiForSource('kinopoisk');
    sessionStorage.setItem(STORAGE_KEY, 'kinopoisk');
    return cachedApi;
  }

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
