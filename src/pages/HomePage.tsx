import { useChainContext } from '../context/ChainContext';
import { useMovieApiForChain } from '../context/MovieApiContext';
import StartScreen from '../components/StartScreen';
import ChainList from '../components/ChainList';
import MovieCard from '../components/MovieCard';
import ActorPicker from '../components/ActorPicker';
import MovieSuggestions from '../components/MovieSuggestions';
import UserComment from '../components/UserComment';
import { useMovieDetails } from '../hooks/useMovieDetails';
import { useTranslation } from 'react-i18next';

/**
 * Main page that either shows the start screen or the active chain view.
 *
 * @returns {JSX.Element} The rendered home page.
 */
export default function HomePage() {
  const { links, currentStep } = useChainContext();

  if (currentStep === 'start' || links.length === 0) {
    return <StartScreen />;
  }

  const currentLink = links[links.length - 1];
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
  const { currentStep, links } = useChainContext();
  const { movie, loading } = useMovieDetails(movieId, api);
  const chainIndex = links.length - 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-20 max-h-[calc(100vh-5rem)] flex flex-col">
            <ChainList />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Mobile chain summary */}
          <div className="md:hidden">
            <ChainList />
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

          <div className="border-t border-gray-800 pt-6">
            {currentStep === 'pick-actor' && movie && (
              <ActorPicker movieId={movie.id} />
            )}
            {currentStep === 'pick-movie' && <MovieSuggestions />}
          </div>
        </div>
      </div>
    </div>
  );
}
