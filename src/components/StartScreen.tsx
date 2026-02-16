import { useState, useEffect } from 'react';
import type { Movie } from '../types/movie';
import { getTrendingMovies, searchMovies, posterUrl } from '../services/tmdb';
import { useChainContext } from '../context/ChainContext';

export default function StartScreen() {
  const { startChain } = useChainContext();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTrendingMovies()
      .then(setTrending)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setSearching(true);
      searchMovies(query)
        .then(setSearchResults)
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const movies = query.trim() ? searchResults : trending;
  const title = query.trim() ? 'Search Results' : 'Trending This Week';

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold text-red-300 mb-2">Failed to load movies</h2>
          <p className="text-red-200/70 text-sm">{error}</p>
          <p className="text-red-200/50 text-xs mt-3">
            Make sure your TMDB API key is set in the .env file.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Start Your Movie Chain</h1>
        <p className="text-gray-400">Pick a movie to begin. Each next movie will be linked by a shared actor.</p>
      </div>

      <div className="max-w-md mx-auto mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a movie..."
          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
      </div>

      <h2 className="text-lg font-semibold text-gray-300 mb-4">
        {title}
        {(loading || searching) && (
          <span className="ml-2 inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        )}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {movies.map((movie) => (
          <button
            key={movie.id}
            onClick={() => startChain(movie)}
            className="group text-left rounded-lg overflow-hidden bg-gray-800/50 hover:bg-gray-800 border border-gray-800 hover:border-indigo-500/50 transition-all hover:scale-[1.02]"
          >
            {movie.poster_path ? (
              <img
                src={posterUrl(movie.poster_path, 'w342')}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-700 flex items-center justify-center text-gray-500 text-sm">
                No Poster
              </div>
            )}
            <div className="p-2">
              <h3 className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
                {movie.title}
              </h3>
              <p className="text-xs text-gray-500">
                {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {!loading && !searching && movies.length === 0 && query.trim() && (
        <p className="text-center text-gray-500 mt-8">No movies found for "{query}"</p>
      )}
    </div>
  );
}
