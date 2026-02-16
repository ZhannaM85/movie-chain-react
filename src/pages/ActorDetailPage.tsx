import { useParams, Link } from 'react-router-dom';
import { useActorDetails } from '../hooks/useActorDetails';
import { profileUrl, posterUrl } from '../services/tmdb';

export default function ActorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const personId = id ? parseInt(id, 10) : null;
  const { actor, movies, loading, error } = useActorDetails(personId);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center gap-2 text-gray-400">
        <span className="inline-block w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        Loading actor details...
      </div>
    );
  }

  if (error || !actor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-red-400">Failed to load actor details.</p>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
          Back to chain
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 inline-block">
        &larr; Back to chain
      </Link>

      <div className="flex flex-col sm:flex-row gap-6 mb-8">
        {actor.profile_path ? (
          <img
            src={profileUrl(actor.profile_path, 'h632')}
            alt={actor.name}
            className="w-full sm:w-56 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-full sm:w-56 aspect-[2/3] rounded-xl bg-gray-800 flex items-center justify-center text-gray-600 flex-shrink-0">
            No Photo
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{actor.name}</h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
            {actor.birthday && (
              <span>Born: {new Date(actor.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            )}
            {actor.place_of_birth && <span>{actor.place_of_birth}</span>}
          </div>

          {actor.biography && (
            <p className="text-gray-300 leading-relaxed text-sm">{actor.biography}</p>
          )}
        </div>
      </div>

      {movies.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-200 mb-4">Known For</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {movies.slice(0, 20).map((movie) => (
              <Link
                key={movie.id}
                to={`/movie/${movie.id}`}
                className="rounded-lg overflow-hidden bg-gray-800/50 border border-gray-800 hover:border-indigo-500/50 hover:bg-gray-800 transition-all hover:scale-[1.02]"
              >
                <img
                  src={posterUrl(movie.poster_path, 'w342')}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover"
                />
                <div className="p-2">
                  <h4 className="text-sm font-medium text-gray-200 truncate">{movie.title}</h4>
                  <p className="text-xs text-gray-500">
                    {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
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
