import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChainContext } from '../context/ChainContext';
import { posterUrl, profileUrl, getActorDetails } from '../services/tmdb';

export default function ChainPage() {
  const { links, resetChain, undoLast } = useChainContext();

  if (links.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-white mb-3">No Chain Yet</h1>
        <p className="text-gray-400 mb-6">Start building your movie chain to see it here.</p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
        >
          Start a Chain
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/" className="text-sm text-indigo-400 hover:text-indigo-300 mb-2 inline-block">
            &larr; Back to chain
          </Link>
          <h1 className="text-2xl font-bold text-white">
            Your Movie Chain
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {links.length} movie{links.length !== 1 ? 's' : ''} linked together
          </p>
        </div>
        <div className="flex items-center gap-2">
          {links.length > 1 && (
            <button
              onClick={undoLast}
              className="text-sm px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              Undo Last
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm('Start a new chain? This will clear your current progress.')) {
                resetChain();
              }
            }}
            className="text-sm px-3 py-1.5 rounded-md bg-gray-800 hover:bg-red-900/50 hover:text-red-300 text-gray-300 transition-colors"
          >
            New Chain
          </button>
        </div>
      </div>

      <div className="space-y-0">
        {links.map((link, index) => (
          <div key={`${link.movie.id}-${index}`}>
            {index > 0 && link.connectingActorName && (
              <div className="flex items-center gap-3 py-3 pl-6">
                <div className="w-px h-6 bg-indigo-500/40" />
                <Link
                  to={link.connectingActorId ? `/actor/${link.connectingActorId}` : '#'}
                  className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {link.connectingActorId && (
                    <ActorAvatar actorId={link.connectingActorId} />
                  )}
                  <span>{link.connectingActorName}</span>
                </Link>
              </div>
            )}

            <Link
              to={`/movie/${link.movie.id}`}
              className="flex gap-4 p-4 rounded-xl bg-gray-800/60 border border-gray-700/50 hover:border-indigo-500/40 hover:bg-gray-800/80 transition-all group"
            >
              <span className="text-lg font-bold text-gray-600 w-8 text-right flex-shrink-0 pt-1">
                {index + 1}
              </span>
              {link.movie.poster_path ? (
                <img
                  src={posterUrl(link.movie.poster_path, 'w185')}
                  alt={link.movie.title}
                  className="w-20 sm:w-24 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-20 sm:w-24 aspect-[2/3] rounded-lg bg-gray-700 flex items-center justify-center text-gray-500 text-xs flex-shrink-0">
                  No Poster
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-200 group-hover:text-white truncate">
                  {link.movie.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                  <span>
                    {link.movie.release_date
                      ? new Date(link.movie.release_date).getFullYear()
                      : 'N/A'}
                  </span>
                  {link.movie.vote_average > 0 && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {link.movie.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                {link.movie.overview && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {link.movie.overview}
                  </p>
                )}
                {link.comment && (
                  <div className="mt-2 text-sm text-indigo-300/80 italic">
                    &ldquo;{link.comment}&rdquo;
                  </div>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActorAvatar({ actorId }: { actorId: number }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    getActorDetails(actorId)
      .then((actor) => {
        if (!ignore && actor.profile_path) {
          setImgSrc(profileUrl(actor.profile_path));
        }
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, [actorId]);

  if (!imgSrc) {
    return (
      <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      </div>
    );
  }

  return (
    <img src={imgSrc} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
  );
}
