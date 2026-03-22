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
  const { currentStep, links, selectedActorId, prependMode, cancelPrepend } = useChainContext();
  const { movie, loading } = useMovieDetails(movieId, api);
  const chainIndex = prependMode ? 0 : links.length - 1;
  useSyncCastAppearances(movieId, movie?.credits?.cast, true);

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

          {prependMode && (
            <div className="rounded-lg border border-indigo-500/40 bg-indigo-950/30 px-3 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-indigo-200/90">{t('prependToChainBanner')}</p>
              <button
                type="button"
                onClick={() => cancelPrepend()}
                className="text-sm shrink-0 px-3 py-1.5 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors self-start sm:self-auto"
              >
                {t('cancel')}
              </button>
            </div>
          )}

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
            {currentStep === 'pick-actor' && movie?.credits && (
              <ActorPicker credits={movie.credits} />
            )}
            {currentStep === 'pick-movie' && (
              <MovieSuggestions key={selectedActorId ?? 'none'} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
