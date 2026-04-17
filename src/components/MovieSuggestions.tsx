import { useEffect, useState, useMemo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { Movie } from '../types/movie';
import type { Actor } from '../types/movie';
import { defaultPastLinkLoggedDateFromHeadLink, localDateString } from '../lib/dateUtils';
import { useMovieApiForChain } from '../context/MovieApiContext';
import { useChainContext } from '../context/ChainContext';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChallengePointsInline from './ChallengePointsInline';
import { scoreChainStep } from '../gamification/chainScoring';
import { useChainUiPreferences } from '../hooks/useChainUiPreferences';
import { findFirstSelectableMovieId } from '../lib/sequentialSelection';
import { eligibleMovieIdsForRandomPick, pickRandomSelectableId, stableRng } from '../lib/randomSinglePick';
import { TMDB_GENRE_ANIMATION } from '../lib/tmdbGenres';
import { formatCrossListEntries, type CrossListEntry } from '../utils/chainLinks';

type SortOption = 'popularity' | 'title-asc' | 'title-desc' | 'date-newest' | 'date-oldest';

function sortMovies(movies: Movie[], sortBy: SortOption): Movie[] {
  const sorted = [...movies];
  switch (sortBy) {
    case 'title-asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'date-newest':
      return sorted.sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''));
    case 'date-oldest':
      return sorted.sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''));
    case 'popularity':
    default:
      return sorted.sort((a, b) => b.popularity - a.popularity);
  }
}

/**
 * Shows a filtered and sortable list of movies from the selected actor's filmography.
 *
 * @returns {JSX.Element | null} The movie suggestions section, or null if no actor is selected.
 */
export default function MovieSuggestions() {
  const api = useMovieApiForChain();
  const { selectedActorId, addMovie, links, cancelActorSelection, prependMode, crossListData } = useChainContext();
  const navigate = useNavigate();
  const headMovie = prependMode && links[0] ? links[0].movie : null;
  const { t, i18n } = useTranslation();
  const [loggedDateForPastLink, setLoggedDateForPastLink] = useState(() =>
    prependMode === true ? defaultPastLinkLoggedDateFromHeadLink(links[0]) : localDateString()
  );
  const prevPrependRef = useRef(false);

  /** When entering prepend mode, default the date to the former chain head (not today). */
  useEffect(() => {
    if (prependMode === true && !prevPrependRef.current) {
      setLoggedDateForPastLink(defaultPastLinkLoggedDateFromHeadLink(links[0]));
    }
    prevPrependRef.current = prependMode === true;
  }, [prependMode, links]);

  const [actor, setActor] = useState<Actor | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [prevDeps, setPrevDeps] = useState({ actorId: selectedActorId, linksLen: links.length });

  const prependStepPoints = useMemo(() => {
    if (!prependMode || !headMovie || !actor) return null;
    return scoreChainStep(headMovie, actor.popularity);
  }, [prependMode, headMovie, actor]);

  const chainMovieIds = useMemo(() => new Set(links.map((l) => l.movie.id)), [links]);
  const { strictListOrderMovies, randomSinglePickMovies, randomSinglePickLimitToTop12, crossListMemory } =
    useChainUiPreferences();

  /** Union of in-chain IDs and cross-list-blocked IDs so pick modes never land on a blocked movie. */
  const excludedMovieIds = useMemo(() => {
    if (!crossListMemory || crossListData.movieIds.size === 0) return chainMovieIds;
    const merged = new Set(chainMovieIds);
    for (const id of crossListData.movieIds.keys()) merged.add(id);
    return merged;
  }, [chainMovieIds, crossListMemory, crossListData.movieIds]);

  /** Full sort + search order (no 20-movie pagination) — defines “next” for strict list order. */
  const orderedForSequential = useMemo(() => {
    const sorted = sortMovies(movies, sortBy);
    const query = searchQuery.trim().toLowerCase();
    if (query) return sorted.filter((m) => m.title.toLowerCase().includes(query));
    return sorted;
  }, [movies, sortBy, searchQuery]);

  const firstSelectableMovieId = useMemo(
    () => findFirstSelectableMovieId(orderedForSequential, excludedMovieIds),
    [orderedForSequential, excludedMovieIds]
  );

  const eligibleMovieIdsInOrder = useMemo(() => {
    if (!randomSinglePickMovies) return [];
    if (!randomSinglePickLimitToTop12) {
      return orderedForSequential.filter((m) => !excludedMovieIds.has(m.id)).map((m) => m.id);
    }
    return eligibleMovieIdsForRandomPick(orderedForSequential, excludedMovieIds);
  }, [randomSinglePickMovies, randomSinglePickLimitToTop12, orderedForSequential, excludedMovieIds]);

  const randomChosenMovieId = useMemo(() => {
    if (!randomSinglePickMovies || eligibleMovieIdsInOrder.length === 0) return null;
    const seed = `movie|${selectedActorId}|${links.length}|${eligibleMovieIdsInOrder.join(',')}`;
    return pickRandomSelectableId(eligibleMovieIdsInOrder, stableRng(seed));
  }, [randomSinglePickMovies, eligibleMovieIdsInOrder, selectedActorId, links.length]);

  if (selectedActorId !== prevDeps.actorId || links.length !== prevDeps.linksLen) {
    setPrevDeps({ actorId: selectedActorId, linksLen: links.length });
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    if (!selectedActorId) return;
    let ignore = false;

    // Fetch filmography first so Kinopoisk can populate actor cache; getActorDetails may then hit cache
    api
      .getActorMovieCredits(selectedActorId)
      .then((creditsData) =>
        api.getActorDetails(selectedActorId).then((actorData) => ({ actorData, creditsData }))
      )
      .then(({ actorData, creditsData }) => {
        if (ignore) return;
        setActor(actorData);
        const filtered = creditsData.cast
          .filter((m) => m.poster_path && m.release_date)
          .filter((m) => {
            if (api.source !== 'tmdb') return true;
            return !m.genre_ids?.includes(TMDB_GENRE_ANIMATION);
          })
          .sort((a, b) => b.popularity - a.popularity);
        setMovies(filtered);
      })
      .catch((err: Error) => {
        if (ignore) return;
        setError(err.message);
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => { ignore = true; };
  }, [selectedActorId, links, api, i18n.resolvedLanguage, i18n.language]);

  if (!selectedActorId) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 py-4">
        <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        {t('loadingFilmography')}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-600 dark:text-red-400 py-4">{t('failedLoadMoviesWithReason', { error })}</p>;
  }

  return (
    <div>
      {actor && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-indigo-900/20 rounded-lg border border-indigo-800/40">
          {actor.profile_path ? (
            <img
              src={api.profileUrl(actor.profile_path)}
              alt={actor.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
          )}
          <div>
            <Link to={`/actor/${actor.id}`} className="font-semibold text-indigo-800 dark:text-indigo-300 hover:text-indigo-900 dark:text-indigo-200 transition-colors">
              {actor.name}
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('pickFromFilmography')}</p>
          </div>
          <button
            type="button"
            onClick={cancelActorSelection}
            className="ml-auto text-xs px-3 py-1.5 rounded-full border border-indigo-500/60 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-400 transition-colors"
          >
            {t('changeActor')}
          </button>
        </div>
      )}

      {prependMode && (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <label className="text-xs text-gray-500 shrink-0" htmlFor="prepend-logged-date">
            {t('loggedDateForPastMovie')}
          </label>
          <div className="w-36 shrink-0 max-w-full">
            <input
              id="prepend-logged-date"
              type="date"
              value={loggedDateForPastLink}
              onChange={(e) => setLoggedDateForPastLink(e.target.value)}
              className="box-border w-full min-w-0 px-2 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchFilmography')}
          className="w-full sm:max-w-sm px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition cursor-pointer"
        >
          <option value="popularity">{t('sortPopularity')}</option>
          <option value="title-asc">{t('sortTitleAsc')}</option>
          <option value="title-desc">{t('sortTitleDesc')}</option>
          <option value="date-newest">{t('sortDateNewest')}</option>
          <option value="date-oldest">{t('sortDateOldest')}</option>
        </select>
      </div>

      {prependMode && prependStepPoints != null && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <ChallengePointsInline points={prependStepPoints} variant="step" />
          <span>{t('prependLinkChallengePointsHint')}</span>
        </div>
      )}

      <MovieGrid
        movies={movies}
        chainMovieIds={chainMovieIds}
        sortBy={sortBy}
        searchQuery={searchQuery}
        showAll={showAll}
        prependMode={prependMode === true}
        actorPopularity={actor?.popularity ?? null}
        strictListOrderMovies={strictListOrderMovies}
        randomSinglePickMovies={randomSinglePickMovies}
        firstSelectableMovieId={firstSelectableMovieId}
        randomChosenMovieId={randomChosenMovieId}
        crossListMovieIds={crossListMemory ? crossListData.movieIds : null}
        onSelect={(movie) => {
          const wasPrepend = prependMode === true;
          addMovie(movie, prependMode ? loggedDateForPastLink : localDateString());
          navigate('/', { state: { chainUndo: wasPrepend ? 'removeFirstMovie' : 'removeLastMovie' } });
        }}
        posterUrl={api.posterUrl}
        t={t}
      />
      {!searchQuery.trim() && !showAll && movies.length > 20 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          {t('showAllMovies', { count: movies.length })}
        </button>
      )}

      {movies.length === 0 && (
        <p className="text-gray-500 py-4 text-center">{t('noMoreMoviesFromActor')}</p>
      )}
    </div>
  );
}

/**
 * Grid component that displays the actor's movies with search, sort, and pagination controls.
 *
 * @param {{
 *   movies: Movie[];
 *   sortBy: SortOption;
 *   searchQuery: string;
 *   showAll: boolean;
 *   onSelect: (movie: Movie) => void;
 * }} props - The grid props.
 * @returns {JSX.Element} The rendered grid of movies.
 */
function MovieGrid({
  movies,
  chainMovieIds,
  sortBy,
  searchQuery,
  showAll,
  prependMode,
  actorPopularity,
  strictListOrderMovies,
  randomSinglePickMovies,
  firstSelectableMovieId,
  randomChosenMovieId,
  crossListMovieIds,
  onSelect,
  posterUrl,
  t,
}: {
  movies: Movie[];
  chainMovieIds: Set<number>;
  sortBy: SortOption;
  searchQuery: string;
  showAll: boolean;
  prependMode: boolean;
  actorPopularity: number | null;
  strictListOrderMovies: boolean;
  randomSinglePickMovies: boolean;
  firstSelectableMovieId: number | null;
  randomChosenMovieId: number | null;
  crossListMovieIds: Map<number, CrossListEntry[]> | null;
  onSelect: (movie: Movie) => void;
  posterUrl: (path: string | null, size?: string) => string;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  /** Pagination is UI-only; `firstSelectableMovieId` uses full sort+search order (see `orderedForSequential` in parent). */
  const displayMovies = useMemo(() => {
    const sorted = sortMovies(movies, sortBy);
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      return sorted.filter((m) => m.title.toLowerCase().includes(query));
    }
    return showAll ? sorted : sorted.slice(0, 20);
  }, [movies, sortBy, searchQuery, showAll]);

  if (displayMovies.length === 0 && searchQuery.trim()) {
    return (
      <p className="text-gray-500 py-4 text-center">
        {t('noMatchingMovies', { query: searchQuery.trim() })}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {displayMovies.map((movie) => {
        const inChain = chainMovieIds.has(movie.id);
        const crossListNames = crossListMovieIds?.get(movie.id);
        const inCrossList = !!crossListNames && crossListNames.length > 0;
        const randomLocked =
          randomSinglePickMovies &&
          !inChain &&
          !inCrossList &&
          randomChosenMovieId !== null &&
          movie.id !== randomChosenMovieId;
        const sequentialLocked =
          !randomSinglePickMovies &&
          strictListOrderMovies &&
          !inChain &&
          !inCrossList &&
          firstSelectableMovieId !== null &&
          movie.id !== firstSelectableMovieId;
        const listOrderLocked = randomLocked || sequentialLocked;
        const blocked = inChain || inCrossList || listOrderLocked;
        const stepPoints =
          prependMode || blocked ? null : scoreChainStep(movie, actorPopularity);
        const crossListHint = inCrossList
          ? t('movieCrossListBlocked', { lists: formatCrossListEntries(crossListNames) })
          : undefined;
        const ariaLabel = inCrossList
          ? crossListHint
          : randomLocked
            ? t('movieRandomPickLockedAria', { title: movie.title })
            : sequentialLocked
              ? t('movieSequentialLockedAria', { title: movie.title })
              : undefined;
        return (
          <div
            key={movie.id}
            role="button"
            data-selectable={blocked ? undefined : 'true'}
            tabIndex={blocked ? -1 : 0}
            aria-disabled={blocked || undefined}
            aria-label={ariaLabel}
            title={
              inChain
                ? t('movieAlreadyInChain')
                : inCrossList
                  ? crossListHint
                  : randomLocked
                    ? t('movieRandomPickLockedAria', { title: movie.title })
                    : sequentialLocked
                      ? t('movieSequentialLockedAria', { title: movie.title })
                      : undefined
            }
            className={
              'group text-left rounded-lg overflow-hidden border transition-all ' +
              (inChain || inCrossList
                ? 'cursor-not-allowed opacity-40 bg-gray-100/80 dark:bg-gray-800/30 border-gray-200/80 dark:border-gray-800/80'
                : listOrderLocked
                  ? 'cursor-not-allowed border-amber-400/60 dark:border-amber-600/50 bg-amber-50/50 dark:bg-amber-950/25 ring-2 ring-amber-400/35 dark:ring-amber-600/50 opacity-50'
                  : 'cursor-pointer bg-gray-100/80 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-800 hover:border-indigo-600/50 dark:hover:border-indigo-500/50 hover:scale-[1.02]')
            }
            onClick={() => {
              if (!blocked) onSelect(movie);
            }}
            onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
              if (blocked) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(movie);
              }
            }}
          >
            <img
              src={posterUrl(movie.poster_path ?? null, 'w342')}
              alt={movie.title}
              className={
                'w-full aspect-[2/3] object-cover ' +
                (inChain || inCrossList ? 'grayscale' : listOrderLocked ? 'grayscale brightness-[0.85]' : '')
              }
            />
            <div className="p-2">
              <h4
                className={
                  'text-sm font-medium truncate ' +
                  (inChain || inCrossList
                    ? 'text-gray-500'
                    : listOrderLocked
                      ? 'text-gray-800 dark:text-gray-200'
                      : 'text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-900 dark:text-white')
                }
              >
                {movie.title}
              </h4>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                <span>
                  {movie.release_date ? new Date(movie.release_date).getFullYear() : t('na')}
                </span>
                {stepPoints != null && (
                  <ChallengePointsInline points={stepPoints} className="text-gray-500 tabular-nums" />
                )}
              </div>
              {inChain ? (
                <p className="text-[10px] text-gray-600 mt-1 leading-tight">{t('movieAlreadyInChainHint')}</p>
              ) : inCrossList ? (
                <p className="text-[10px] text-orange-700/90 dark:text-orange-400/90 mt-1 leading-tight flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-3 h-3 shrink-0"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                  {crossListHint}
                </p>
              ) : randomLocked ? (
                <p className="text-[10px] text-amber-800/90 dark:text-amber-400/90 mt-1 leading-tight flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-3 h-3 shrink-0"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  {t('movieRandomPickLockedHint')}
                </p>
              ) : sequentialLocked ? (
                <p className="text-[10px] text-amber-800/90 dark:text-amber-400/90 mt-1 leading-tight flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-3 h-3 shrink-0"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                  {t('movieSequentialLockedHint')}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
