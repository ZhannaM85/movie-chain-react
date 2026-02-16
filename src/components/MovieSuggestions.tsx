import { useEffect, useState, useMemo } from 'react';
import type { Movie } from '../types/movie';
import { getActorDetails, getActorMovieCredits, posterUrl, profileUrl } from '../services/tmdb';
import type { Actor } from '../types/movie';
import { useChainContext } from '../context/ChainContext';
import { Link } from 'react-router-dom';

type SortOption = 'popularity' | 'title-asc' | 'title-desc' | 'date-newest' | 'date-oldest';

export default function MovieSuggestions() {
  const { selectedActorId, addMovie, links } = useChainContext();
  const [actor, setActor] = useState<Actor | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [prevDeps, setPrevDeps] = useState({ actorId: selectedActorId, linksLen: links.length });

  if (selectedActorId !== prevDeps.actorId || links.length !== prevDeps.linksLen) {
    setPrevDeps({ actorId: selectedActorId, linksLen: links.length });
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    if (!selectedActorId) return;
    let ignore = false;

    Promise.all([getActorDetails(selectedActorId), getActorMovieCredits(selectedActorId)])
      .then(([actorData, creditsData]) => {
        if (ignore) return;
        setActor(actorData);
        const watchedIds = new Set(links.map((l) => l.movie.id));
        const filtered = creditsData.cast
          .filter((m) => m.poster_path && m.release_date && !watchedIds.has(m.id))
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
  }, [selectedActorId, links]);

  if (!selectedActorId) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-4">
        <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        Loading filmography...
      </div>
    );
  }

  if (error) {
    return <p className="text-red-400 py-4">Failed to load movies: {error}</p>;
  }

  return (
    <div>
      {actor && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-indigo-900/20 rounded-lg border border-indigo-800/40">
          {actor.profile_path ? (
            <img
              src={profileUrl(actor.profile_path)}
              alt={actor.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            </div>
          )}
          <div>
            <Link to={`/actor/${actor.id}`} className="font-semibold text-indigo-300 hover:text-indigo-200 transition-colors">
              {actor.name}
            </Link>
            <p className="text-sm text-gray-400">Pick a movie from their filmography</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search filmography..."
          className="w-full sm:max-w-sm px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition cursor-pointer"
        >
          <option value="popularity">Sort: Popularity</option>
          <option value="title-asc">Sort: Title A–Z</option>
          <option value="title-desc">Sort: Title Z–A</option>
          <option value="date-newest">Sort: Newest first</option>
          <option value="date-oldest">Sort: Oldest first</option>
        </select>
      </div>

      <MovieGrid
        movies={movies}
        sortBy={sortBy}
        searchQuery={searchQuery}
        showAll={showAll}
        onSelect={addMovie}
      />
      {!searchQuery.trim() && !showAll && movies.length > 20 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Show all {movies.length} movies
        </button>
      )}

      {movies.length === 0 && (
        <p className="text-gray-500 py-4 text-center">No more movies available from this actor.</p>
      )}
    </div>
  );
}

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

function MovieGrid({
  movies,
  sortBy,
  searchQuery,
  showAll,
  onSelect,
}: {
  movies: Movie[];
  sortBy: SortOption;
  searchQuery: string;
  showAll: boolean;
  onSelect: (movie: Movie) => void;
}) {
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
        No movies matching "{searchQuery.trim()}"
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {displayMovies.map((movie) => (
        <button
          key={movie.id}
          onClick={() => onSelect(movie)}
          className="group text-left rounded-lg overflow-hidden bg-gray-800/50 hover:bg-gray-800 border border-gray-800 hover:border-indigo-500/50 transition-all hover:scale-[1.02]"
        >
          <img
            src={posterUrl(movie.poster_path, 'w342')}
            alt={movie.title}
            className="w-full aspect-[2/3] object-cover"
          />
          <div className="p-2">
            <h4 className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
              {movie.title}
            </h4>
            <p className="text-xs text-gray-500">
              {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
