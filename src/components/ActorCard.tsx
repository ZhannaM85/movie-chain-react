import { Link } from 'react-router-dom';
import type { KeyboardEvent } from 'react';
import type { Actor } from '../types/movie';
import { useMovieApiForChain } from '../context/MovieApiContext';
import { useTranslation } from 'react-i18next';
import ChallengePointsInline from './ChallengePointsInline';

interface ActorDisabledBridgeInfo {
  fromTitle: string;
  toTitle: string;
  /** Full phrase for tooltip and accessible name (e.g. translated “already used as bridge…”). */
  description: string;
}

interface ActorCardProps {
  actor: Actor;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  /** Compact bridge step (icon + titles on card); `description` used for title tooltip and aria-label. */
  disabledBridge?: ActorDisabledBridgeInfo;
  showLink?: boolean;
  /** Preview difficulty: full step (prepend) or actor-only slice (append pick-actor). */
  challengePoints?: number | null;
  challengePointsVariant?: 'step' | 'actorOnly';
}

/**
 * Renders a selectable or linked card for an actor with optional selection and disabled states.
 *
 * @param {ActorCardProps} props - The component props.
 * @returns {JSX.Element} The rendered actor card.
 */
function BridgeUsedIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
      />
    </svg>
  );
}

export default function ActorCard({
  actor,
  onClick,
  selected,
  disabled,
  disabledBridge,
  showLink = false,
  challengePoints,
  challengePointsVariant = 'step',
}: ActorCardProps) {
  const api = useMovieApiForChain();
  const { t } = useTranslation();
  const inner = (
    <>
      {actor.profile_path ? (
        <img
          src={api.profileUrl(actor.profile_path)}
          alt={actor.name}
          className="w-full aspect-[2/3] object-cover rounded-t-lg"
        />
      ) : (
        <div className="w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-t-lg">
          <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
      )}
      <div className="p-2">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{actor.name}</p>
        {actor.character && (
          <p className="text-xs text-gray-500 truncate">{t('asCharacter', { character: actor.character })}</p>
        )}
        {disabled && disabledBridge && (
          <div className="mt-1 flex items-start gap-1 min-w-0">
            <BridgeUsedIcon className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-500" />
            <p className="text-[10px] text-gray-500 leading-snug min-w-0 break-words line-clamp-4" aria-hidden>
              {disabledBridge.fromTitle}
              <span className="text-gray-600 mx-0.5">→</span>
              {disabledBridge.toTitle}
            </p>
          </div>
        )}
        {challengePoints != null && (
          <div className="mt-1">
            <ChallengePointsInline
              points={challengePoints}
              variant={challengePointsVariant}
              className="text-xs text-gray-500 tabular-nums"
            />
          </div>
        )}
      </div>
    </>
  );

  const baseClasses = 'rounded-lg overflow-hidden border transition-all text-left';
  const stateClasses = selected
    ? 'border-indigo-500 bg-indigo-900/30 ring-2 ring-indigo-500/50'
    : disabled
      ? 'border-gray-200 dark:border-gray-800 bg-gray-100/80 dark:bg-gray-800/30 opacity-40 cursor-not-allowed'
      : 'border-gray-200 dark:border-gray-800 bg-gray-100/80 dark:bg-gray-800/50 hover:border-indigo-600/50 dark:hover:border-indigo-500/50 hover:bg-gray-200 dark:hover:bg-gray-800 hover:scale-[1.02]';

  if (showLink && !onClick) {
    return (
      <Link to={`/actor/${actor.id}`} className={`${baseClasses} ${stateClasses} block`}>
        {inner}
      </Link>
    );
  }

  const ariaLabel =
    disabled && disabledBridge ? `${actor.name}. ${disabledBridge.description}` : undefined;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      title={disabled && disabledBridge ? disabledBridge.description : undefined}
      className={`${baseClasses} ${stateClasses} w-full`}
      onClick={() => {
        if (disabled) return;
        onClick?.();
      }}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {inner}
    </div>
  );
}
