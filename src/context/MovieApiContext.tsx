import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { MovieApi } from '../services/movieApi';
import { getMovieApi, getMovieApiForSource } from '../services/movieApiClient';
import { useChainContext } from './ChainContext';

const MovieApiContext = createContext<MovieApi | null>(null);

/**
 * Provides the active movie API (TMDB or Kinopoisk) to the component subtree.
 * Resolves the API on mount with auto-fallback from TMDB to Kinopoisk.
 *
 * @param {{ children: ReactNode }} props - The provider props.
 * @returns {JSX.Element} The context provider element.
 */
export function MovieApiProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [api, setApi] = useState<MovieApi | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMovieApi()
      .then(setApi)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold text-red-300 mb-2">{t('failedLoadMovies')}</h2>
          <p className="text-red-200/70 text-sm">{error}</p>
          <p className="text-red-200/50 text-xs mt-3">{t('apiKeyHint')}</p>
        </div>
      </div>
    );
  }

  if (!api) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="inline-block w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <MovieApiContext.Provider value={api}>{children}</MovieApiContext.Provider>;
}

/**
 * Hook to access the movie API. Must be used within MovieApiProvider.
 *
 * @returns {MovieApi} The active movie API.
 */
export function useMovieApi(): MovieApi {
  const api = useContext(MovieApiContext);
  if (!api) {
    throw new Error('useMovieApi must be used within MovieApiProvider');
  }
  return api;
}

/**
 * Returns the API for the current context: uses chain source when viewing a chain,
 * otherwise the session API. Must be used within both MovieApiProvider and ChainProvider.
 */
export function useMovieApiForChain(): MovieApi {
  const sessionApi = useMovieApi();
  const { links, source } = useChainContext();
  if (links.length > 0 && source) {
    return getMovieApiForSource(source);
  }
  return sessionApi;
}
