import type { MovieApi, MovieSource } from './movieApi';
import { createTmdbApi } from './tmdbMovieApi';
import { createKinopoiskApi } from './kinopoisk';

const STORAGE_KEY = 'movie-api-source';

let cachedApi: MovieApi | null = null;
const apiBySource: { tmdb?: MovieApi; kinopoisk?: MovieApi } = {};

/**
 * Resolves the active movie API with auto-fallback: tries TMDB first,
 * switches to Kinopoisk if TMDB fails (e.g. blocked in region).
 *
 * @returns {Promise<MovieApi>} The active API implementation.
 */
export async function getMovieApi(): Promise<MovieApi> {
  if (cachedApi) return cachedApi;

  const stored = sessionStorage.getItem(STORAGE_KEY) as 'tmdb' | 'kinopoisk' | null;
  if (stored === 'kinopoisk') {
    const kinopoiskKey = import.meta.env.VITE_KINOPOISK_API_KEY as string;
    if (kinopoiskKey) {
      cachedApi = createKinopoiskApi();
      return cachedApi;
    }
  }

  const tmdbKey = import.meta.env.VITE_TMDB_API_KEY as string;
  if (tmdbKey) {
    try {
      const tmdb = createTmdbApi();
      await tmdb.getTrendingMovies();
      cachedApi = tmdb;
      sessionStorage.setItem(STORAGE_KEY, 'tmdb');
      return cachedApi;
    } catch {
      // TMDB failed, try Kinopoisk
    }
  }

  const kinopoiskKey = import.meta.env.VITE_KINOPOISK_API_KEY as string;
  if (kinopoiskKey) {
    cachedApi = createKinopoiskApi();
    sessionStorage.setItem(STORAGE_KEY, 'kinopoisk');
    return cachedApi;
  }

  if (tmdbKey) {
    throw new Error(
      'TMDB is unavailable in your region. Add VITE_KINOPOISK_API_KEY to .env for Kinopoisk fallback.'
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
