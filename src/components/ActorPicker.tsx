import { useState, useEffect } from 'react';
import type { Actor } from '../types/movie';
import { useMovieApiForChain } from '../context/MovieApiContext';
import { useChainContext } from '../context/ChainContext';
import ActorCard from './ActorCard';
import { useTranslation } from 'react-i18next';

interface ActorPickerProps {
  movieId: number;
}

/**
 * Shows the main cast for a movie and lets the user pick an actor to continue the chain.
 *
 * @param {ActorPickerProps} props - The component props.
 * @returns {JSX.Element} The rendered actor picker.
 */
export default function ActorPicker({ movieId }: ActorPickerProps) {
  const api = useMovieApiForChain();
  const { selectActor, excludedActorId } = useChainContext();
  const { t, i18n } = useTranslation();
  const [cast, setCast] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    api
      .getMovieCredits(movieId)
      .then((credits) => {
        const actors = credits.cast.filter(
          (a) => a.known_for_department === 'Acting' || a.order !== undefined
        );
        setCast(actors);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [movieId, api, i18n.resolvedLanguage, i18n.language]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-4">
        <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        {t('loadingCast')}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-400 py-4">{t('failedLoadCast', { error })}</p>;
  }

  const displayCast = showAll ? cast : cast.slice(0, 12);

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-200 mb-3">{t('pickActorToContinue')}</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {displayCast.map((actor) => {
          const isExcluded = actor.id === excludedActorId;
          return (
            <ActorCard
              key={actor.id}
              actor={actor}
              disabled={isExcluded}
              onClick={() => selectActor(actor.id, actor.name)}
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
