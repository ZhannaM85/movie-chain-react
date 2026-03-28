import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { MovieApi } from '../services/movieApi';
import {
  getMovieApi,
  getMovieApiForSource,
  getPreferKinopoisk,
  setPreferKinopoisk as persistPreferKinopoisk,
  resetMovieApiCache,
  MOVIE_API_ERR_SERVICE_UNAVAILABLE,
  MOVIE_API_ERR_NO_TMDB_CONFIGURED,
} from '../services/movieApiClient';
import { useChainContext } from './ChainContext';

type MovieApiContextValue = {
  api: MovieApi | null;
  preferKinopoisk: boolean;
  setPreferKinopoisk: (value: boolean) => void;
  hasKinopoiskKey: boolean;
};

const MovieApiContext = createContext<MovieApiContextValue | null>(null);

function bootstrapErrorDisplay(
  err: Error,
  t: (key: string) => string
): { body: string; hint: string | null } {
  if (err.message === MOVIE_API_ERR_SERVICE_UNAVAILABLE) {
    return {
      body: t('serviceUnavailableMessage'),
      hint: t('serviceUnavailableRefresh'),
    };
  }
  if (err.message === MOVIE_API_ERR_NO_TMDB_CONFIGURED) {
    return { body: t('apiKeyHintTmdbOnly'), hint: null };
  }
  return { body: err.message, hint: null };
}

/**
 * Provides the active movie API (TMDB or Kinopoisk) to the component subtree.
 * Supports a manual toggle to prefer Kinopoisk when TMDB is blocked.
 *
 * @param {{ children: ReactNode }} props - The provider props.
 * @returns {JSX.Element} The context provider element.
 */
export function MovieApiProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [api, setApi] = useState<MovieApi | null>(null);
  const [error, setError] = useState<{ body: string; hint: string | null } | null>(null);
  const [preferKinopoisk, setPreferKinopoiskState] = useState(getPreferKinopoisk);
  const hasKinopoiskKey = Boolean(import.meta.env.VITE_KINOPOISK_API_KEY as string);

  const resolveApi = useCallback(() => {
    setError(null);
    getMovieApi()
      .then(setApi)
      .catch((err: Error) => setError(bootstrapErrorDisplay(err, t)));
  }, [t]);

  useEffect(() => {
    resolveApi();
  }, [resolveApi]);

  const setPreferKinopoisk = useCallback((value: boolean) => {
    persistPreferKinopoisk(value);
    setPreferKinopoiskState(value);
    resetMovieApiCache();
    setApi(null);
    getMovieApi()
      .then(setApi)
      .catch((err: Error) => setError(bootstrapErrorDisplay(err, t)));
  }, [t]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold text-red-300 mb-2">{t('failedLoadMovies')}</h2>
          <p className="text-red-200/70 text-sm">{error.body}</p>
          {error.hint ? (
            <p className="text-red-200/50 text-xs mt-3">{error.hint}</p>
          ) : null}
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

  return (
    <MovieApiContext.Provider
      value={{
        api,
        preferKinopoisk,
        setPreferKinopoisk,
        hasKinopoiskKey,
      }}
    >
      {children}
    </MovieApiContext.Provider>
  );
}

/**
 * Hook to access the movie API. Must be used within MovieApiProvider.
 *
 * @returns {MovieApi} The active movie API.
 */
export function useMovieApi(): MovieApi {
  const ctx = useContext(MovieApiContext);
  if (!ctx?.api) {
    throw new Error('useMovieApi must be used within MovieApiProvider');
  }
  return ctx.api;
}

/**
 * Hook to access API preference and toggle. Must be used within MovieApiProvider.
 */
export function useMovieApiPreference() {
  const ctx = useContext(MovieApiContext);
  if (!ctx) {
    throw new Error('useMovieApiPreference must be used within MovieApiProvider');
  }
  return ctx;
}

/**
 * Returns the API for the current context: uses chain source when viewing a chain,
 * otherwise the session API. Must be used within both MovieApiProvider and ChainProvider.
 */
export function useMovieApiForChain(): MovieApi {
  const ctx = useContext(MovieApiContext);
  const { links, source } = useChainContext();
  if (!ctx?.api) {
    throw new Error('useMovieApiForChain must be used within MovieApiProvider');
  }
  if (links.length > 0 && source) {
    return getMovieApiForSource(source);
  }
  return ctx.api;
}
