import { Link } from 'react-router-dom';
import type { Movie } from '../types/movie';
import { posterUrl } from '../services/tmdb';

interface MovieCardProps {
  movie: Movie;
  showLink?: boolean;
}

export default function MovieCard({ movie, showLink = true }: MovieCardProps) {
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';

  const content = (
    <div className="flex gap-4 bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
      {movie.poster_path ? (
        <img
          src={posterUrl(movie.poster_path, 'w185')}
          alt={movie.title}
          className="w-28 sm:w-36 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-28 sm:w-36 aspect-[2/3] rounded-lg bg-gray-700 flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
          No Poster
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold text-white mb-1">{movie.title}</h2>
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
          <span>{year}</span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {rating}
          </span>
          {movie.runtime && <span>{movie.runtime} min</span>}
        </div>
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {movie.genres.map((g) => (
              <span key={g.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                {g.name}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-400 line-clamp-3">{movie.overview}</p>
      </div>
    </div>
  );

  if (showLink) {
    return (
      <Link to={`/movie/${movie.id}`} className="block hover:ring-2 hover:ring-indigo-500/40 rounded-xl transition-all">
        {content}
      </Link>
    );
  }
  return content;
}
