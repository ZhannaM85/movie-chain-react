import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useMemo, useEffect, useState } from 'react';
import { useActorDetails } from '../hooks/useActorDetails';
import { useMovieApiForChain } from '../context/MovieApiContext';
import { useChainContext } from '../context/ChainContext';
import { useTranslation } from 'react-i18next';
import type { Movie } from '../types/movie';
import { getBridgeMovieIdsForActor, getCastMovieIdsForActorInChain } from '../gamification/actorStats';

function MoviePosterGrid({
  title,
  movies,
  api,
  t,
  className = 'mb-10',
}: {
  title: string;
  movies: Movie[];
  api: ReturnType<typeof useMovieApiForChain>;
  t: (key: string, opts?: Record<string, string | number>) => string;
  className?: string;
}) {
  if (movies.length === 0) return null;
  return (
    <div className={className}>
      <h2 className="text-xl font-semibold text-gray-200 mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {movies.map((movie) => (
          <Link
            key={movie.id}
            to={`/movie/${movie.id}`}
            className="rounded-lg overflow-hidden bg-gray-800/50 border border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800 transition-all hover:scale-[1.02]"
          >
            <img
              src={api.posterUrl(movie.poster_path, 'w342')}
              alt={movie.title}
              className="w-full aspect-[2/3] object-cover"
            />
            <div className="p-2">
              <h4 className="text-sm font-medium text-gray-200 truncate">{movie.title}</h4>
              <p className="text-xs text-gray-500">
                {movie.release_date ? new Date(movie.release_date).getFullYear() : t('na')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Page that shows biography and notable movies for a specific actor.
 *
 * @returns {JSX.Element} The actor detail view.
 */
export default function ActorDetailPage() {
  const api = useMovieApiForChain();
  const { t, i18n } = useTranslation();
  const { gamificationProfile, links } = useChainContext();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fromStats = searchParams.get('from');
  const cameFromStatsPage = fromStats === 'cast' || fromStats === 'bridge';
  const castSectionFirst = fromStats === 'cast';
  const personId = id && !Number.isNaN(Number.parseInt(id, 10)) ? Number.parseInt(id, 10) : null;
  const actorIdStr = id ?? '';
  const { actor, movies, loading, error } = useActorDetails(personId, api);

  const bridgeMovieIds = useMemo(
    () => getBridgeMovieIdsForActor(gamificationProfile, actorIdStr, links),
    [gamificationProfile, actorIdStr, links]
  );
  const castMovieIds = useMemo(
    () => getCastMovieIdsForActorInChain(gamificationProfile, actorIdStr, links),
    [gamificationProfile, actorIdStr, links]
  );

  const [chainBridgeMovies, setChainBridgeMovies] = useState<Movie[]>([]);
  const [chainCastMovies, setChainCastMovies] = useState<Movie[]>([]);
  const [chainMoviesLoading, setChainMoviesLoading] = useState(false);

  useEffect(() => {
    const unique = Array.from(new Set([...bridgeMovieIds, ...castMovieIds]));
    if (unique.length === 0) {
      setChainBridgeMovies([]);
      setChainCastMovies([]);
      return;
    }

    let cancelled = false;
    setChainMoviesLoading(true);

    Promise.all(
      unique.map(async (mid) => {
        try {
          const d = await api.getMovieDetails(mid);
          const { credits: _c, ...movie } = d;
          return movie as Movie;
        } catch {
          return null;
        }
      })
    )
      .then((results) => {
        if (cancelled) return;
        const byId = new Map<number, Movie>();
        for (const m of results) {
          if (m) byId.set(m.id, m);
        }
        setChainBridgeMovies(bridgeMovieIds.map((i) => byId.get(i)).filter((m): m is Movie => m != null));
        setChainCastMovies(castMovieIds.map((i) => byId.get(i)).filter((m): m is Movie => m != null));
      })
      .finally(() => {
        if (!cancelled) setChainMoviesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api, bridgeMovieIds, castMovieIds]);

  useEffect(() => {
    if (chainMoviesLoading) return;
    const targetId =
      fromStats === 'cast' && chainCastMovies.length > 0
        ? 'actor-chain-cast'
        : fromStats === 'bridge' && chainBridgeMovies.length > 0
          ? 'actor-chain-bridge'
          : null;
    if (!targetId) return;
    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [chainMoviesLoading, fromStats, chainBridgeMovies.length, chainCastMovies.length]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center gap-2 text-gray-400">
        <span className="inline-block w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        {t('loadingActorDetails')}
      </div>
    );
  }

  if (error || !actor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-red-400">{t('failedLoadActorDetails')}</p>
        <Link
          to={cameFromStatsPage ? '/stats' : '/'}
          className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block"
        >
          &larr; {t(cameFromStatsPage ? 'navigateBackToStats' : 'backToChain')}
        </Link>
      </div>
    );
  }

  const showChainSpinner =
    chainMoviesLoading && (bridgeMovieIds.length > 0 || castMovieIds.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to={cameFromStatsPage ? '/stats' : '/'}
        className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 inline-block"
      >
        &larr; {t(cameFromStatsPage ? 'navigateBackToStats' : 'backToChain')}
      </Link>

      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {actor.profile_path ? (
          <img
            src={api.profileUrl(actor.profile_path, 'h632')}
            alt={actor.name}
            className="w-full sm:w-56 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-full sm:w-56 aspect-[2/3] rounded-xl bg-gray-800 flex items-center justify-center text-gray-600 flex-shrink-0">
            {t('noPhoto')}
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{actor.name}</h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
            {actor.birthday && (
              <span>
                {t('born')}:{' '}
                {new Date(actor.birthday).toLocaleDateString(i18n.language, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            )}
            {actor.place_of_birth && <span>{actor.place_of_birth}</span>}
          </div>

          {actor.biography && (
            <p className="text-gray-300 leading-relaxed text-sm">{actor.biography}</p>
          )}
        </div>
      </div>

      {showChainSpinner && (
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          {t('loadingFilmography')}
        </div>
      )}

      {castSectionFirst ? (
        <>
          <div id="actor-chain-cast" className="scroll-mt-24">
            <MoviePosterGrid
              title={t('actorYourChainCast')}
              movies={chainCastMovies}
              api={api}
              t={t}
              className="mb-10"
            />
          </div>
          <div id="actor-chain-bridge" className="scroll-mt-24">
            <MoviePosterGrid
              title={t('actorYourChainBridge')}
              movies={chainBridgeMovies}
              api={api}
              t={t}
              className="mb-10"
            />
          </div>
        </>
      ) : (
        <>
          <div id="actor-chain-bridge" className="scroll-mt-24">
            <MoviePosterGrid
              title={t('actorYourChainBridge')}
              movies={chainBridgeMovies}
              api={api}
              t={t}
              className="mb-10"
            />
          </div>
          <div id="actor-chain-cast" className="scroll-mt-24">
            <MoviePosterGrid
              title={t('actorYourChainCast')}
              movies={chainCastMovies}
              api={api}
              t={t}
              className="mb-10"
            />
          </div>
        </>
      )}

      {movies.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-200 mb-4">{t('knownFor')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {movies.slice(0, 20).map((movie) => (
              <Link
                key={movie.id}
                to={`/movie/${movie.id}`}
                className="rounded-lg overflow-hidden bg-gray-800/50 border border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800 transition-all hover:scale-[1.02]"
              >
                <img
                  src={api.posterUrl(movie.poster_path, 'w342')}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover"
                />
                <div className="p-2">
                  <h4 className="text-sm font-medium text-gray-200 truncate">{movie.title}</h4>
                  <p className="text-xs text-gray-500">
                    {movie.release_date ? new Date(movie.release_date).getFullYear() : t('na')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
