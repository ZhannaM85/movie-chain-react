import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useMemo, useEffect, useState } from 'react';
import { useActorDetails } from '../hooks/useActorDetails';
import { useMovieApiForChain } from '../context/MovieApiContext';
import { useChainContext } from '../context/ChainContext';
import { useTranslation } from 'react-i18next';
import type { Movie, MovieCredits } from '../types/movie';
import { getBridgeMovieIdsForActor, creditsIncludeActor } from '../gamification/actorStats';

function ActorDetailsChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-5 h-5 transition-transform shrink-0 ${expanded ? '' : '-rotate-90'}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

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
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {movies.map((movie) => (
          <Link
            key={movie.id}
            to={`/movie/${movie.id}`}
            className="rounded-lg overflow-hidden bg-gray-100/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 hover:border-indigo-600/50 dark:hover:border-indigo-500/50 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all hover:scale-[1.02]"
          >
            <img
              src={api.posterUrl(movie.poster_path, 'w342')}
              alt={movie.title}
              className="w-full aspect-[2/3] object-cover"
            />
            <div className="p-2">
              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{movie.title}</h4>
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
  /** Chain film ids in order (each film once) — cast section uses live API credits, not stored snapshots. */
  const orderedChainMovieIds = useMemo(() => {
    const seen = new Set<number>();
    const out: number[] = [];
    for (const l of links) {
      if (!seen.has(l.movie.id)) {
        seen.add(l.movie.id);
        out.push(l.movie.id);
      }
    }
    return out;
  }, [links]);

  const [chainBridgeMovies, setChainBridgeMovies] = useState<Movie[]>([]);
  const [chainCastMovies, setChainCastMovies] = useState<Movie[]>([]);
  const [chainMoviesLoading, setChainMoviesLoading] = useState(false);
  const [actorDetailsOpen, setActorDetailsOpen] = useState(false);

  const hasExpandableActorDetails =
    Boolean(actor?.biography?.trim()) ||
    Boolean(actor?.birthday) ||
    Boolean(actor?.place_of_birth);

  useEffect(() => {
    setActorDetailsOpen(false);
  }, [id]);

  useEffect(() => {
    const unique = Array.from(new Set([...bridgeMovieIds, ...orderedChainMovieIds]));
    if (unique.length === 0 || personId == null) {
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
          const { credits, ...movie } = d;
          return { movie: movie as Movie, credits };
        } catch {
          return null;
        }
      })
    )
      .then((results) => {
        if (cancelled) return;
        const byId = new Map<number, Movie>();
        const creditsById = new Map<number, MovieCredits>();
        for (const r of results) {
          if (!r) continue;
          byId.set(r.movie.id, r.movie);
          creditsById.set(r.movie.id, r.credits);
        }
        setChainBridgeMovies(bridgeMovieIds.map((i) => byId.get(i)).filter((m): m is Movie => m != null));
        const verifiedCastIds = orderedChainMovieIds.filter((mid) =>
          creditsIncludeActor(creditsById.get(mid), personId)
        );
        setChainCastMovies(verifiedCastIds.map((i) => byId.get(i)).filter((m): m is Movie => m != null));
      })
      .finally(() => {
        if (!cancelled) setChainMoviesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api, bridgeMovieIds, orderedChainMovieIds, personId]);

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
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <span className="inline-block w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        {t('loadingActorDetails')}
      </div>
    );
  }

  if (error || !actor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-red-600 dark:text-red-400">{t('failedLoadActorDetails')}</p>
        <Link
          to={cameFromStatsPage ? '/stats' : '/'}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-2 inline-block"
        >
          &larr; {t(cameFromStatsPage ? 'navigateBackToStats' : 'backToChain')}
        </Link>
      </div>
    );
  }

  const showChainSpinner =
    chainMoviesLoading && (bridgeMovieIds.length > 0 || orderedChainMovieIds.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to={cameFromStatsPage ? '/stats' : '/'}
        className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4 inline-block"
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
          <div className="w-full sm:w-56 aspect-[2/3] rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 flex-shrink-0">
            {t('noPhoto')}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{actor.name}</h1>

          {hasExpandableActorDetails ? (
            <>
              <button
                type="button"
                className="flex items-center gap-2 w-full sm:w-auto max-w-full text-left text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-1.5 -ml-1 px-1 rounded-lg hover:bg-gray-100/80 dark:bg-gray-800/60 transition-colors"
                onClick={() => setActorDetailsOpen((o) => !o)}
                aria-expanded={actorDetailsOpen}
                aria-controls="actor-details-panel"
                id="actor-details-toggle"
              >
                <ActorDetailsChevron expanded={actorDetailsOpen} />
                <span>{t('actorDetailsToggle')}</span>
              </button>
              {actorDetailsOpen ? (
                <div
                  id="actor-details-panel"
                  role="region"
                  aria-labelledby="actor-details-toggle"
                  className="mt-3 space-y-3"
                >
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
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
                  {actor.biography ? (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap">{actor.biography}</p>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
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
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('knownFor')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {movies.slice(0, 20).map((movie) => (
              <Link
                key={movie.id}
                to={`/movie/${movie.id}`}
                className="rounded-lg overflow-hidden bg-gray-100/80 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 hover:border-indigo-600/50 dark:hover:border-indigo-500/50 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all hover:scale-[1.02]"
              >
                <img
                  src={api.posterUrl(movie.poster_path, 'w342')}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover"
                />
                <div className="p-2">
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{movie.title}</h4>
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
