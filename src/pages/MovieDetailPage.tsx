import { useParams, Link } from 'react-router-dom';
import { useMovieDetails } from '../hooks/useMovieDetails';
import { useMovieApiForChain } from '../context/MovieApiContext';
import { useChainContext } from '../context/ChainContext';
import UserComment from '../components/UserComment';
import { useTranslation } from 'react-i18next';

/**
 * Page that shows full details for a movie, including cast and any chain comment.
 *
 * @returns {JSX.Element} The movie detail view.
 */
export default function MovieDetailPage() {
  const api = useMovieApiForChain();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const movieId = id ? parseInt(id, 10) : null;
  const { movie, loading, error } = useMovieDetails(movieId, api);
  const { links } = useChainContext();

  const chainIndex = links.findIndex((l) => l.movie.id === movieId);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center gap-2 text-gray-400">
        <span className="inline-block w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        {t('loadingMovie')}
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-red-400">{t('failedLoadMovieDetails')}</p>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
          {t('backToChain')}
        </Link>
      </div>
    );
  }

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : t('na');
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';
  const cast = movie.credits?.cast?.slice(0, 20) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 inline-block">
        &larr; {t('backToChain')}
      </Link>

      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {movie.poster_path ? (
          <img
            src={api.posterUrl(movie.poster_path, 'w500')}
            alt={movie.title}
            className="w-full sm:w-64 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-full sm:w-64 aspect-[2/3] rounded-xl bg-gray-800 flex items-center justify-center text-gray-600 flex-shrink-0">
            {t('noPoster')}
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-1">{movie.title}</h1>
          {movie.tagline && (
            <p className="text-gray-500 italic mb-3">"{movie.tagline}"</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
            <span>{year}</span>
            {movie.runtime && <span>{movie.runtime} {t('min')}</span>}
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {rating} ({movie.vote_count} {t('votes')})
            </span>
          </div>

          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genres.map((g) => (
                <span key={g.id} className="text-xs px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                  {g.name}
                </span>
              ))}
            </div>
          )}

          <p className="text-gray-300 leading-relaxed">{movie.overview}</p>

          {chainIndex >= 0 && <UserComment chainIndex={chainIndex} />}
        </div>
      </div>

      {cast.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-200 mb-4">{t('cast')}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {cast.map((actor) => (
              <Link
                key={actor.id}
                to={`/actor/${actor.id}`}
                className="rounded-lg overflow-hidden bg-gray-800/50 border border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800 transition-all hover:scale-[1.02]"
              >
                {actor.profile_path ? (
                  <img
                    src={api.profileUrl(actor.profile_path)}
                    alt={actor.name}
                    className="w-full aspect-[2/3] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gray-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  </div>
                )}
                <div className="p-2">
                  <p className="text-sm font-medium text-gray-200 truncate">{actor.name}</p>
                  {actor.character && (
                    <p className="text-xs text-gray-500 truncate">{t('asCharacter', { character: actor.character })}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
