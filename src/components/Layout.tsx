import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import { useChainContext } from '../context/ChainContext';
import { useMovieApiForChain, useMovieApiPreference } from '../context/MovieApiContext';
import { useTranslation } from 'react-i18next';
import { buildChainRecap } from '../gamification/chainRecap';
import GamificationToasts from './GamificationToasts';
import MoviesMilestoneModal from './MoviesMilestoneModal';
import ChainListMenu from './ChainListMenu';

/** Set to `true` to show the Kinopoisk / TMDB preference switch in the header again. */
const SHOW_KINOPOISK_TOGGLE = false;

/** Shared box + border; `inline-flex` is separate so responsive `hidden` / `max-sm:hidden` is not overridden. */
const headerToolbarChromeBase =
  'h-9 shrink-0 rounded-md border border-gray-700 bg-gray-800 items-center justify-center';
const headerToolbarChrome = `${headerToolbarChromeBase} inline-flex`;

/**
 * Main application shell with header, navigation, and responsive layout around the page content.
 *
 * @param {{ children: ReactNode }} props - The layout props.
 * @returns {JSX.Element} The rendered layout.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const api = useMovieApiForChain();
  const { preferKinopoisk, setPreferKinopoisk, hasKinopoiskKey } = useMovieApiPreference();
  const { links, source, resetChain, gamificationProfile, createList, chainLists } =
    useChainContext();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const confirmAndStartNewChain = useCallback(() => {
    const recap = buildChainRecap(links);
    const msg =
      links.length === 0
        ? t('confirmNewChain')
        : t('confirmNewChainRecap', {
            length: recap.length,
            difficulty: recap.totalDifficulty,
            actors: recap.uniqueActors,
            decades: recap.distinctDecades,
          });
    if (window.confirm(msg)) {
      resetChain();
    }
    setMobileNavOpen(false);
  }, [links, t, resetChain]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Mobile: fixed bar (reliable vs overflow-x + sticky). Desktop: sm:contents + sticky header. */}
      <div className="max-sm:fixed max-sm:inset-x-0 max-sm:top-0 max-sm:z-50 max-sm:bg-gray-900/95 max-sm:backdrop-blur max-sm:border-b max-sm:border-gray-800 sm:contents">
        <header className="relative z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800 max-sm:border-b-0 sm:sticky sm:top-0">
          <div className="max-w-7xl relative mx-auto flex h-14 min-w-0 items-center px-3 sm:px-4 max-sm:gap-2 max-sm:overflow-x-hidden max-sm:justify-start sm:justify-between sm:gap-4">
            <div className="flex shrink-0 items-center gap-2 sm:min-w-0 sm:gap-4">
            <button
              type="button"
              className={`sm:hidden shrink-0 ${headerToolbarChrome} w-9 p-0 text-gray-300 hover:bg-gray-800/90 hover:border-gray-600 transition-colors`}
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-label={t('navHome')}
            >
              <span className="sr-only">{t('navHome')}</span>
              <span className="space-y-1">
                <span className="block w-4 h-[2px] bg-current" />
                <span className="block w-4 h-[2px] bg-current" />
                <span className="block w-4 h-[2px] bg-current" />
              </span>
            </button>
            <Link
              to="/"
              className="hidden min-w-0 text-xl font-bold tracking-tight text-white hover:text-indigo-400 transition-colors sm:inline-block"
              onClick={() => setMobileNavOpen(false)}
            >
              {t('appName')}
            </Link>
            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-4 text-sm text-gray-400">
              <Link
                to="/"
                className="hover:text-indigo-400 transition-colors"
              >
                {t('navHome')}
              </Link>
              <Link
                to="/stats"
                className="hover:text-indigo-400 transition-colors"
              >
                {t('navStats')}
              </Link>
              <Link
                to="/about"
                className="hover:text-indigo-400 transition-colors"
              >
                {t('navAbout')}
              </Link>
            </nav>
          </div>
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-4">
            <ChainListMenu />
            {SHOW_KINOPOISK_TOGGLE && hasKinopoiskKey && (
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <span className="hidden sm:inline">{t('useKinopoisk')}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferKinopoisk}
                  onClick={() => {
                    const newVal = !preferKinopoisk;
                    if (!newVal && links.length > 0 && source === 'kinopoisk') {
                      const recap = buildChainRecap(links);
                      const msg = t('confirmNewChainRecap', {
                        length: recap.length,
                        difficulty: recap.totalDifficulty,
                        actors: recap.uniqueActors,
                        decades: recap.distinctDecades,
                      });
                      if (!window.confirm(msg)) return;
                      resetChain();
                    }
                    setPreferKinopoisk(newVal);
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    preferKinopoisk
                      ? 'border-indigo-500 bg-indigo-600'
                      : 'border-gray-600 bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${
                      preferKinopoisk ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            )}
            {gamificationProfile.currentStreak > 0 && (
              <span
                className="hidden sm:inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-amber-800/60 bg-amber-950/50 px-2.5 text-xs text-amber-200/90 whitespace-nowrap"
                title={t('streakTooltip')}
              >
                {t('streakLabel', { count: gamificationProfile.currentStreak })}
              </span>
            )}
            <span
              className={`${headerToolbarChrome} hidden px-2.5 text-xs font-medium text-gray-400 sm:inline-flex`}
              title={api.source === 'kinopoisk' ? t('dataSourceKinopoisk') : t('dataSourceTmdb')}
            >
              {api.source === 'kinopoisk' ? t('dataSourceKinopoisk') : t('dataSourceTmdb')}
            </span>
            <select
              aria-label={t('language')}
              value={i18n.language}
              onChange={(e) => {
                void i18n.changeLanguage(e.target.value);
                setMobileNavOpen(false);
              }}
              className="h-9 max-w-[5.5rem] shrink-0 cursor-pointer rounded-md border border-gray-700 bg-gray-800 px-1.5 py-0 text-sm text-gray-200 outline-none transition-colors hover:border-gray-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 sm:max-w-[7.25rem] sm:px-2 sm:text-base"
            >
              <option value="en-US">English</option>
              <option value="ru-RU">Русский</option>
            </select>
            {links.length > 0 && (
              <Link
                to="/chain"
                className={`${headerToolbarChrome} px-2 text-xs sm:text-sm text-gray-400 hover:border-gray-600 hover:text-indigo-400 transition-colors whitespace-nowrap`}
                title={t('chainCount', { count: links.length })}
                aria-label={t('chainCount', { count: links.length })}
                onClick={() => setMobileNavOpen(false)}
              >
                <span className="sm:hidden">{t('chainCountCompact', { count: links.length })}</span>
                <span className="hidden sm:inline">{t('chainCount', { count: links.length })}</span>
              </Link>
            )}
            {links.length > 0 && (
              <button
                type="button"
                onClick={confirmAndStartNewChain}
                className={`max-sm:hidden sm:inline-flex ${headerToolbarChromeBase} px-3 text-sm text-gray-300 transition-colors hover:border-red-800/80 hover:bg-red-950/40 hover:text-red-300`}
                title={t('clearChainTooltip')}
                aria-label={t('clearChain')}
              >
                {t('clearChain')}
              </button>
            )}
          </div>
          </div>
        </header>
        {mobileNavOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 z-50 bg-gray-900/98 backdrop-blur border-b border-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col gap-1 text-sm">
              <div className="pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('appName')}
              </div>
              <Link
                to="/"
                className="py-1 text-gray-300 hover:text-indigo-300 transition-colors"
                onClick={() => setMobileNavOpen(false)}
              >
                {t('navHome')}
              </Link>
              <Link
                to="/stats"
                className="py-1 text-gray-300 hover:text-indigo-300 transition-colors"
                onClick={() => setMobileNavOpen(false)}
              >
                {t('navStats')}
              </Link>
              <Link
                to="/about"
                className="py-1 text-gray-300 hover:text-indigo-300 transition-colors"
                onClick={() => setMobileNavOpen(false)}
              >
                {t('navAbout')}
              </Link>
            </div>
          </div>
        )}
      </div>
      <main
        className={`overflow-x-hidden ${
          links.length > 0 ? 'min-w-0 pb-[5.5rem] sm:pb-0' : 'min-w-0'
        } max-sm:pt-14`}
      >
        {children}
      </main>
      {links.length > 0 && (
        <button
          type="button"
          onClick={() => {
            createList(t('newListNumbered', { n: chainLists.length + 1 }));
          }}
          className="sm:hidden fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-indigo-700/70 bg-indigo-950/90 text-indigo-100 shadow-lg shadow-black/50 backdrop-blur-sm transition hover:border-indigo-500 hover:bg-indigo-900/85 active:scale-95 bottom-[max(1rem,env(safe-area-inset-bottom))]"
          title={t('addList')}
          aria-label={t('addListFabAria')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      )}
      <GamificationToasts />
      <MoviesMilestoneModal />
    </div>
  );
}
