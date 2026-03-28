import { useState } from 'react';
import type { MovieCredits } from '../types/movie';
import { useChainContext } from '../context/ChainContext';
import ActorCard from './ActorCard';
import { useTranslation } from 'react-i18next';
import { scoreActorContribution, scoreChainStep } from '../gamification/chainScoring';

interface ActorPickerProps {
  credits: MovieCredits;
}

/**
 * Shows the main cast for a movie and lets the user pick an actor to continue the chain.
 * Uses credits passed from parent to avoid duplicate API calls.
 *
 * @param {ActorPickerProps} props - The component props.
 * @returns {JSX.Element} The rendered actor picker.
 */
function ChevronToggleIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`w-5 h-5 transition-transform ${expanded ? '' : '-rotate-90'}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function ActorPicker({ credits }: ActorPickerProps) {
  const { selectActor, excludedActorId, prependMode, links } = useChainContext();
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const [actorsExpanded, setActorsExpanded] = useState(true);

  const cast = credits.cast.filter(
    (a) => a.known_for_department === 'Acting' || a.order !== undefined
  );

  const displayCast = showAll ? cast : cast.slice(0, 12);

  return (
    <div>
      <div className="flex items-start gap-2 mb-3">
        <h3 className="text-lg font-semibold text-gray-200 flex-1 min-w-0">
          {prependMode ? t('pickActorToPrepend') : t('pickActorToContinue')}
        </h3>
        <button
          type="button"
          onClick={() => setActorsExpanded((v) => !v)}
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-700 bg-gray-800/80 text-gray-300 hover:bg-gray-800 hover:border-indigo-500/50 hover:text-indigo-300 transition-colors"
          aria-expanded={actorsExpanded}
          aria-label={actorsExpanded ? t('collapseActorsAria') : t('expandActorsAria')}
        >
          <ChevronToggleIcon expanded={actorsExpanded} />
        </button>
      </div>
      {actorsExpanded && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {displayCast.map((actor) => {
              const isExcluded = actor.id === excludedActorId;
              const headMovie = links[0]?.movie;
              const challengePoints =
                prependMode && headMovie
                  ? scoreChainStep(headMovie, actor.popularity)
                  : scoreActorContribution(actor.popularity);
              const challengePointsVariant = prependMode ? 'step' : 'actorOnly';
              return (
                <ActorCard
                  key={actor.id}
                  actor={actor}
                  disabled={isExcluded}
                  onClick={() => selectActor(actor.id, actor.name, actor.popularity)}
                  challengePoints={challengePoints}
                  challengePointsVariant={challengePointsVariant}
                />
              );
            })}
          </div>
          {!showAll && cast.length > 12 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {t('showAllCast', { count: cast.length })}
            </button>
          )}
        </>
      )}
    </div>
  );
}
