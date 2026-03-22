import { useState } from 'react';
import type { MovieCredits } from '../types/movie';
import { useChainContext } from '../context/ChainContext';
import ActorCard from './ActorCard';
import { useTranslation } from 'react-i18next';

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
export default function ActorPicker({ credits }: ActorPickerProps) {
  const { selectActor, excludedActorId, prependMode } = useChainContext();
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  const cast = credits.cast.filter(
    (a) => a.known_for_department === 'Acting' || a.order !== undefined
  );

  const displayCast = showAll ? cast : cast.slice(0, 12);

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-200 mb-3">
        {prependMode ? t('pickActorToPrepend') : t('pickActorToContinue')}
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {displayCast.map((actor) => {
          const isExcluded = actor.id === excludedActorId;
          return (
            <ActorCard
              key={actor.id}
              actor={actor}
              disabled={isExcluded}
              onClick={() => selectActor(actor.id, actor.name, actor.popularity)}
            />
          );
        })}
      </div>
      {!showAll && cast.length > 12 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {t('showAllCast', { count: cast.length })}
        </button>
      )}
    </div>
  );
}
