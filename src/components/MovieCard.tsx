import { Link } from 'react-router-dom';
import type { Movie } from '../types/movie';
import { useMovieApiForChain } from '../context/MovieApiContext';
import { useTranslation } from 'react-i18next';
import ChallengePointsInline from './ChallengePointsInline';
import MovieOverviewClamp from './MovieOverviewClamp';

interface MovieCardProps {
  movie: Movie;
  showLink?: boolean;
  /** Per-link gamification score when this card shows a movie from the chain */
  challengePoints?: number | null;
}

/**
 * Displays a card with key information about a movie, optionally wrapped in a link.
 *
 * @param {MovieCardProps} props - The component props.
 * @returns {JSX.Element} The rendered movie card.
 */
export default function MovieCard({ movie, showLink = true, challengePoints }: MovieCardProps) {
  const api = useMovieApiForChain();
  const { t } = useTranslation();
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : t('na');
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';
  const toMovie = `/movie/${movie.id}`;

  const poster =
    movie.poster_path ? (
      <img
        src={api.posterUrl(movie.poster_path, 'w185')}
        alt={movie.title}
        className="w-28 sm:w-36 rounded-lg object-cover flex-shrink-0"
      />
    ) : (
      <div className="w-28 sm:w-36 aspect-[2/3] rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
        {t('noPoster')}
      </div>
    );

  return (
    <div className="flex gap-4 bg-gray-100/80 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-300/50 dark:border-gray-700/50 hover:border-indigo-500/60 dark:hover:border-indigo-500/40 transition-colors">
      {showLink ? (
        <Link to={toMovie} className="flex-shrink-0">
          {poster}
        </Link>
      ) : (
        poster
      )}
      <div className="flex-1 min-w-0">
        {showLink ? (
          <Link to={toMovie} className="block mb-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{movie.title}</h2>
          </Link>
        ) : (
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{movie.title}</h2>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <span>{year}</span>
          <ChallengePointsInline points={challengePoints} />
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {rating}
          </span>
          {movie.runtime && (
            <span>
              {movie.runtime} {t('min')}
            </span>
          )}
        </div>
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {movie.genres.map((g) => (
              <span key={g.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {g.name}
              </span>
            ))}
          </div>
        )}
        {movie.overview && (
          <MovieOverviewClamp
            overview={movie.overview}
            className="text-sm text-gray-600 dark:text-gray-400"
            resetKey={movie.id}
            linkTo={showLink ? toMovie : undefined}
            showLink={showLink}
          />
        )}
      </div>
    </div>
  );
}
