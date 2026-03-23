import type { ReactNode } from 'react';
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

/**
 * Main page that either shows the start screen or the active chain view.
 *
 * @returns {JSX.Element} The rendered home page.
 */
export default function HomePage() {
  const { links, currentStep, prependMode } = useChainContext();

  if (currentStep === 'start' || links.length === 0) {
    return <StartScreen />;
  }

  const currentLink = prependMode ? links[0] : links[links.length - 1];
  const currentMovieId = currentLink.movie.id;

  return <ChainView movieId={currentMovieId} />;
}

/**
 * Renders the current movie, user comment, and the next-step controls for the chain.
 *
 * @param {{ movieId: number }} props - The props containing the current movie ID.
 * @returns {JSX.Element} The chain view for the current movie.
 */
function ChainView({ movieId }: { movieId: number }) {
  const api = useMovieApiForChain();
  const { t } = useTranslation();
  const { currentStep, links, selectedActorId, prependMode } = useChainContext();
  const { movie, loading } = useMovieDetails(movieId, api);
  const chainIndex = prependMode ? 0 : links.length - 1;
  useSyncCastAppearances(movieId, movie?.credits?.cast, true);

  let pickStepPanel: ReactNode = null;
  if (currentStep === 'pick-actor' && movie?.credits) {
    pickStepPanel = <ActorPicker credits={movie.credits} />;
  } else if (currentStep === 'pick-movie') {
    pickStepPanel = <MovieSuggestions key={selectedActorId ?? 'none'} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Sidebar — chain only; pick steps stay in main on md+ (wide picker) */}
        <aside className="hidden md:block w-72 lg:w-80 xl:w-96 flex-shrink-0">
          <div className="sticky top-20 h-[calc(100vh-5rem)] flex flex-col min-h-0 overflow-hidden">
            <ChainList />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Mobile: pickers inline with chain only when prepending; otherwise pickers below the list */}
          <div className="md:hidden flex flex-col gap-4 min-h-0">
            {prependMode ? (
              <div className="flex flex-col h-[min(80vh,40rem)] min-h-0">
                <ChainList pickStepPanel={pickStepPanel} />
              </div>
            ) : (
              <>
                <div className="flex flex-col h-[min(80vh,40rem)] min-h-0">
                  <ChainList />
                </div>
                {pickStepPanel != null && (
                  <div className="border-t border-gray-800 pt-4">{pickStepPanel}</div>
                )}
              </>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-8">
              <span className="inline-block w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              {t('loadingMovieDetails')}
            </div>
          ) : movie ? (
            <>
              <MovieCard movie={movie} />
              <UserComment chainIndex={chainIndex} />
            </>
          ) : null}

          {pickStepPanel != null && (
            <div className="hidden md:block border-t border-gray-800 pt-6">{pickStepPanel}</div>
          )}
        </div>
      </div>
    </div>
  );
}
