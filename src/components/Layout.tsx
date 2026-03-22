import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useChainContext } from '../context/ChainContext';
import { useMovieApiForChain, useMovieApiPreference } from '../context/MovieApiContext';
import { useTranslation } from 'react-i18next';
import { buildChainRecap } from '../gamification/chainRecap';
import GamificationToasts from './GamificationToasts';

/** Set to `true` to show the Kinopoisk / TMDB preference switch in the header again. */
const SHOW_KINOPOISK_TOGGLE = false;

/**
 * Main application shell with header, navigation, and responsive layout around the page content.
 *
 * @param {{ children: ReactNode }} props - The layout props.
 * @returns {JSX.Element} The rendered layout.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const api = useMovieApiForChain();
  const { preferKinopoisk, setPreferKinopoisk, hasKinopoiskKey } = useMovieApiPreference();
  const { links, source, resetChain, gamificationProfile } = useChainContext();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between relative">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="text-xl font-bold tracking-tight text-white hover:text-indigo-400 transition-colors"
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
            {/* Mobile hamburger */}
            <button
              type="button"
              className="sm:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-colors"
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
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                className="hidden sm:inline text-xs px-2 py-0.5 rounded-md bg-amber-950/50 border border-amber-800/60 text-amber-200/90"
                title={t('streakTooltip')}
              >
                {t('streakLabel', { count: gamificationProfile.currentStreak })}
              </span>
            )}
            <span
              className="text-xs px-2 py-0.5 rounded-md bg-gray-800 border border-gray-700 text-gray-400"
              title={api.source === 'kinopoisk' ? t('dataSourceKinopoisk') : t('dataSourceTmdb')}
            >
              {api.source === 'kinopoisk' ? t('dataSourceKinopoisk') : t('dataSourceTmdb')}
            </span>
            <label className="flex items-center gap-2 text-xs text-gray-400">
              <select
                value={i18n.language}
                onChange={(e) => {
                  void i18n.changeLanguage(e.target.value);
                  setMobileNavOpen(false);
                }}
                className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-200"
              >
                <option value="en-US">English</option>
                <option value="ru-RU">Русский</option>
              </select>
            </label>
            {links.length > 0 && (
              <Link
                to="/chain"
                className="text-xs sm:text-sm text-gray-400 hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0"
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
                onClick={() => {
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
                }}
                className="inline-flex items-center justify-center shrink-0 rounded-md bg-gray-800 hover:bg-red-900/50 hover:text-red-300 text-gray-300 transition-colors h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 text-sm"
                title={t('newChain')}
                aria-label={t('newChain')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 sm:hidden"
                  aria-hidden
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span className="hidden sm:inline">{t('newChain')}</span>
              </button>
            )}
          </div>
        </div>
      </header>
      {/* Mobile dropdown nav */}
      {mobileNavOpen && (
        <div className="sm:hidden bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col gap-1 text-sm">
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
      <main>{children}</main>
      <GamificationToasts />
    </div>
  );
}
