import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useChainContext } from '../context/ChainContext';
import { useMovieApiForChain } from '../context/MovieApiContext';
import StartScreen from '../components/StartScreen';
import ChainList from '../components/ChainList';
import MovieCard from '../components/MovieCard';
import ActorPicker from '../components/ActorPicker';
import MovieSuggestions from '../components/MovieSuggestions';
import UserComment from '../components/UserComment';
import { useMovieDetails } from '../hooks/useMovieDetails';
import { useSyncCastAppearances } from '../hooks/useSyncCastAppearances';
import { useTranslation } from 'react-i18next';
import { findHeroChainIndexByLastWatched } from '../lib/chainHero';

/**
 * Main page that either shows the start screen or the active chain view.
 *
 * @returns {JSX.Element} The rendered home page.
 */
export default function HomePage() {
  const { links, currentStep, prependMode } = useChainContext();

  const heroChainIndex = useMemo(() => findHeroChainIndexByLastWatched(links), [links]);
  const pickChainIndex = prependMode ? 0 : Math.max(0, links.length - 1);

  if (currentStep === 'start' || links.length === 0) {
    return <StartScreen />;
  }

  return <ChainView heroChainIndex={heroChainIndex} pickChainIndex={pickChainIndex} />;
}

/**
 * Renders the current movie, user comment, and the next-step controls for the chain.
 *
 * Hero uses {@link findHeroChainIndexByLastWatched}; pick step uses `pickChainIndex` (prepend head or tail).
 */
function ChainView({
  heroChainIndex,
  pickChainIndex,
}: {
  heroChainIndex: number;
  pickChainIndex: number;
}) {
  const api = useMovieApiForChain();
  const { t } = useTranslation();
  const { currentStep, links, selectedActorId, prependMode } = useChainContext();
  const heroMovieId = links[heroChainIndex].movie.id;
  const pickMovieId = links[pickChainIndex].movie.id;
  const sameMovieForHeroAndPick = heroMovieId === pickMovieId;

  const heroDetails = useMovieDetails(heroMovieId, api);
  const pickDetails = useMovieDetails(sameMovieForHeroAndPick ? null : pickMovieId, api);
  const pickMovie = sameMovieForHeroAndPick ? heroDetails.movie : pickDetails.movie;
  const loading = heroDetails.loading;

  useSyncCastAppearances(pickMovieId, pickMovie?.credits?.cast, true, pickMovie?.credits?.id);

  let pickStepPanel: ReactNode = null;
  if (currentStep === 'pick-actor' && pickMovie?.credits) {
    pickStepPanel = <ActorPicker credits={pickMovie.credits} />;
  } else if (currentStep === 'pick-movie') {
    pickStepPanel = <MovieSuggestions key={selectedActorId ?? 'none'} />;
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-0 md:px-4">
      <div className="flex flex-col gap-6">
        <div className="order-1 min-w-0 w-full flex flex-col gap-6 px-4 md:px-0 md:sticky md:top-20 md:z-10 md:self-start md:w-full md:bg-gray-50 dark:md:bg-gray-950 md:pb-2 md:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.07)] dark:md:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.45)]">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 py-8">
              <span className="inline-block w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              {t('loadingMovieDetails')}
            </div>
          ) : heroDetails.movie ? (
            <>
              <div className="order-1">
                <MovieCard
                  movie={heroDetails.movie}
                  challengePoints={links[heroChainIndex].stepDifficulty}
                />
              </div>
              <div className="order-3">
                <UserComment chainIndex={heroChainIndex} />
              </div>
            </>
          ) : null}

          {pickStepPanel != null && !prependMode && (
            <div className="order-2 border-t border-gray-200 dark:border-gray-800 pt-4 md:pt-6">
              {pickStepPanel}
            </div>
          )}
        </div>

        <aside className="order-2 w-full min-w-0 max-w-full shrink-0">
          <div className="flex flex-col w-full min-h-0">
            <ChainList prependPickPanel={prependMode ? pickStepPanel : undefined} />
          </div>
        </aside>
      </div>
    </div>
  );
}
