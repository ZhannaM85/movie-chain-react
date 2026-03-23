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
 * @returns {JSX.Element} The rendered chain view for the current movie.
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
    <div className="max-w-7xl mx-auto py-6 px-0 md:px-4">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Mobile: order-1 = current movie + actors first; desktop: chain left. Chain is full-bleed width on small screens. */}
        <aside className="order-2 md:order-1 w-full min-w-0 max-w-full md:w-72 lg:w-80 xl:w-96 shrink-0">
          <div className="flex flex-col w-full md:overflow-hidden md:h-[calc(100vh-5rem)] md:sticky md:top-20 min-h-0">
            <ChainList />
          </div>
        </aside>

        <div className="order-1 md:order-2 md:flex-1 min-w-0 w-full flex flex-col gap-6 px-4 md:px-0">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-8">
              <span className="inline-block w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              {t('loadingMovieDetails')}
            </div>
          ) : movie ? (
            <>
              <div className="order-1">
                <MovieCard movie={movie} />
              </div>
              <div className="order-3 md:order-2">
                <UserComment chainIndex={chainIndex} />
              </div>
            </>
          ) : null}

          {pickStepPanel != null && (
            <div className="order-2 md:order-3 border-t border-gray-800 pt-4 md:pt-6">
              {pickStepPanel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
