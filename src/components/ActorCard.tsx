import { Link } from 'react-router-dom';
import type { Actor } from '../types/movie';
import { profileUrl } from '../services/tmdb';

interface ActorCardProps {
  actor: Actor;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  showLink?: boolean;
}

export default function ActorCard({ actor, onClick, selected, disabled, showLink = false }: ActorCardProps) {
  const inner = (
    <>
      {actor.profile_path ? (
        <img
          src={profileUrl(actor.profile_path)}
          alt={actor.name}
          className="w-full aspect-[2/3] object-cover rounded-t-lg"
        />
      ) : (
        <div className="w-full aspect-[2/3] bg-gray-700 flex items-center justify-center rounded-t-lg">
          <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
      )}
      <div className="p-2">
        <p className="text-sm font-medium text-gray-200 truncate">{actor.name}</p>
        {actor.character && (
          <p className="text-xs text-gray-500 truncate">as {actor.character}</p>
        )}
      </div>
    </>
  );

  const baseClasses = 'rounded-lg overflow-hidden border transition-all text-left';
  const stateClasses = selected
    ? 'border-indigo-500 bg-indigo-900/30 ring-2 ring-indigo-500/50'
    : disabled
      ? 'border-gray-800 bg-gray-800/30 opacity-40 cursor-not-allowed'
      : 'border-gray-800 bg-gray-800/50 hover:border-indigo-500/50 hover:bg-gray-800 hover:scale-[1.02]';

  if (showLink && !onClick) {
    return (
      <Link to={`/actor/${actor.id}`} className={`${baseClasses} ${stateClasses} block`}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`${baseClasses} ${stateClasses} w-full`}
      disabled={disabled}
    >
      {inner}
    </button>
  );
}
