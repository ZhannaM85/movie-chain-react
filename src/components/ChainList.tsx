import { Link } from 'react-router-dom';
import { useChainContext } from '../context/ChainContext';
import { posterUrl } from '../services/tmdb';

export default function ChainList() {
  const { links, undoLast } = useChainContext();

  if (links.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Chain</h2>
        {links.length > 1 && (
          <button
            onClick={undoLast}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Undo
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {links.map((link, index) => (
          <div key={`${link.movie.id}-${index}`}>
            {index > 0 && link.connectingActorName && (
              <div className="flex items-center gap-1.5 py-1 pl-3">
                <div className="w-px h-3 bg-gray-700" />
                <span className="text-xs text-indigo-400">{link.connectingActorName}</span>
              </div>
            )}
            <Link
              to={`/movie/${link.movie.id}`}
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-800/70 transition-colors group"
            >
              <span className="text-xs text-gray-600 w-5 text-right flex-shrink-0">{index + 1}</span>
              {link.movie.poster_path ? (
                <img
                  src={posterUrl(link.movie.poster_path, 'w185')}
                  alt={link.movie.title}
                  className="w-8 h-12 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-12 rounded bg-gray-700 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm text-gray-300 group-hover:text-white truncate">
                  {link.movie.title}
                </p>
                <p className="text-xs text-gray-600">
                  {link.movie.release_date ? new Date(link.movie.release_date).getFullYear() : ''}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
