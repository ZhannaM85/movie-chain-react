import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useState, useCallback, useRef } from 'react';
import { useChainContext } from '../context/ChainContext';
import { useMovieApiForChain, useMovieApiPreference } from '../context/MovieApiContext';
import { useTranslation } from 'react-i18next';
import { buildChainRecap } from '../gamification/chainRecap';
import GamificationToasts from './GamificationToasts';
import MoviesMilestoneModal from './MoviesMilestoneModal';
import ChainListMenu from './ChainListMenu';
import { ChainListsBackupError } from '../utils/chainListsBackup';
import { useTheme } from '../context/ThemeContext';

/** Set to `true` to show the Kinopoisk / TMDB preference switch in the header again. */
const SHOW_KINOPOISK_TOGGLE = false;

/** Shared box + border; `inline-flex` is separate so responsive `hidden` / `max-sm:hidden` is not overridden. */
const headerToolbarChromeBase =
  'h-9 shrink-0 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 items-center justify-center';
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
  const { links, source, resetChain, gamificationProfile, createList, chainLists, importChainListsFromJson } =
    useChainContext();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [fabAddOpen, setFabAddOpen] = useState(false);
  const fabImportInputRef = useRef<HTMLInputElement>(null);
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const runFabImportMerge = useCallback(
    (text: string) => {
      try {
        importChainListsFromJson(text, 'merge');
        window.alert(t('backupImportSuccess'));
      } catch (e) {
        const msg =
          e instanceof ChainListsBackupError
            ? e.message
            : e instanceof Error
              ? e.message
              : t('backupImportError');
        window.alert(msg);
      }
      setFabAddOpen(false);
    },
    [importChainListsFromJson, t]
  );

  const onFabImportFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        runFabImportMerge(String(reader.result ?? ''));
      };
      reader.onerror = () => {
        window.alert(t('backupImportError'));
      };
      reader.readAsText(file);
    },
    [runFabImportMerge, t]
  );

  const handleFabAddEmpty = useCallback(() => {
    createList(t('newListNumbered', { n: chainLists.length + 1 }));
    setFabAddOpen(false);
  }, [chainLists.length, createList, t]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Mobile: fixed bar (reliable vs overflow-x + sticky). Desktop: sm:contents + sticky header. */}
      <div className="max-sm:fixed max-sm:inset-x-0 max-sm:top-0 max-sm:z-50 max-sm:bg-white/95 dark:max-sm:bg-gray-900/95 max-sm:backdrop-blur max-sm:border-b max-sm:border-gray-200 dark:border-gray-800 sm:contents">
        <header className="relative z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 max-sm:border-b-0 sm:sticky sm:top-0">
          <div className="max-w-7xl relative mx-auto flex h-14 min-w-0 items-center px-3 sm:px-4 max-sm:gap-2 max-sm:overflow-x-hidden max-sm:justify-start sm:justify-between sm:gap-4">
            <div className="flex shrink-0 items-center gap-2 sm:min-w-0 sm:gap-4">
            <button
              type="button"
              className={`sm:hidden shrink-0 ${headerToolbarChrome} w-9 p-0 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800/90 hover:border-gray-400 dark:border-gray-600 transition-colors`}
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
              className="hidden min-w-0 text-xl font-bold tracking-tight text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors sm:inline-block"
              onClick={() => setMobileNavOpen(false)}
            >
              {t('appName')}
            </Link>
            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <Link
                to="/"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {t('navHome')}
              </Link>
              <Link
                to="/stats"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {t('navStats')}
              </Link>
              <Link
                to="/about"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {t('navAbout')}
              </Link>
            </nav>
          </div>
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-4">
            <ChainListMenu />
            {SHOW_KINOPOISK_TOGGLE && hasKinopoiskKey && (
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
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
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 ${
                    preferKinopoisk
                      ? 'border-indigo-500 bg-indigo-600'
                      : 'border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-700'
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
                className="hidden sm:inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-amber-800/60 bg-amber-50 dark:bg-amber-950/50 px-2.5 text-xs text-amber-900/90 dark:text-amber-200/90 whitespace-nowrap"
                title={t('streakTooltip')}
              >
                {t('streakLabel', { count: gamificationProfile.currentStreak })}
              </span>
            )}
            <span
              className={`${headerToolbarChrome} hidden px-2.5 text-xs font-medium text-gray-600 dark:text-gray-400 sm:inline-flex`}
              title={api.source === 'kinopoisk' ? t('dataSourceKinopoisk') : t('dataSourceTmdb')}
            >
              {api.source === 'kinopoisk' ? t('dataSourceKinopoisk') : t('dataSourceTmdb')}
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className={`max-sm:hidden ${headerToolbarChrome} w-9 p-0 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800/90 hover:border-gray-400 dark:border-gray-600 transition-colors`}
              aria-label={theme === 'dark' ? t('themeSwitchToLight') : t('themeSwitchToDark')}
              title={theme === 'dark' ? t('themeSwitchToLight') : t('themeSwitchToDark')}
            >
              {theme === 'dark' ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <select
              aria-label={t('language')}
              value={i18n.language}
              onChange={(e) => {
                void i18n.changeLanguage(e.target.value);
                setMobileNavOpen(false);
              }}
              className="h-9 max-w-[5.5rem] shrink-0 cursor-pointer rounded-md border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-1.5 py-0 text-sm text-gray-800 dark:text-gray-200 outline-none transition-colors hover:border-gray-400 dark:border-gray-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-gray-900 sm:max-w-[7.25rem] sm:px-2 sm:text-base"
            >
              <option value="en-US">English</option>
              <option value="ru-RU">Русский</option>
            </select>
            {links.length > 0 && (
              <Link
                to="/chain"
                className={`${headerToolbarChrome} px-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:border-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap`}
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
                className={`max-sm:hidden sm:inline-flex ${headerToolbarChromeBase} px-3 text-sm text-gray-700 dark:text-gray-300 transition-colors hover:border-red-300 dark:hover:border-red-800/80 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-800 dark:hover:text-red-300`}
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
          <div className="sm:hidden absolute top-full left-0 right-0 z-50 bg-white/98 dark:bg-gray-900/98 backdrop-blur border-b border-gray-200 dark:border-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col gap-1 text-sm">
              <div className="pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('appName')}
              </div>
              <Link
                to="/"
                className="py-1 text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                onClick={() => setMobileNavOpen(false)}
              >
                {t('navHome')}
              </Link>
              <Link
                to="/stats"
                className="py-1 text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                onClick={() => setMobileNavOpen(false)}
              >
                {t('navStats')}
              </Link>
              <Link
                to="/about"
                className="py-1 text-gray-700 dark:text-gray-300 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                onClick={() => setMobileNavOpen(false)}
              >
                {t('navAbout')}
              </Link>
              <div className="flex items-center justify-between gap-3 border-t border-gray-200 dark:border-gray-800 mt-2 pt-3">
                <span className="text-sm text-gray-600 dark:text-gray-400" id="mobile-theme-label">
                  {t('themeMenuLabel')}
                </span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`${headerToolbarChrome} w-9 shrink-0 p-0 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800/90 hover:border-gray-400 dark:border-gray-600 transition-colors`}
                  aria-labelledby="mobile-theme-label"
                  aria-label={theme === 'dark' ? t('themeSwitchToLight') : t('themeSwitchToDark')}
                  title={theme === 'dark' ? t('themeSwitchToLight') : t('themeSwitchToDark')}
                >
                  {theme === 'dark' ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
              </div>
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
        <>
          <input
            ref={fabImportInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label={t('backupImportFileAria')}
            onChange={onFabImportFileChange}
          />
          <button
            type="button"
            onClick={() => setFabAddOpen(true)}
            className="sm:hidden fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-indigo-500/70 dark:border-indigo-700/70 bg-indigo-100/90 dark:bg-indigo-950/90 text-indigo-900 dark:text-indigo-100 shadow-lg shadow-gray-900/10 dark:shadow-black/50 backdrop-blur-sm transition hover:border-indigo-500 hover:bg-indigo-200/90 dark:hover:bg-indigo-900/85 active:scale-95 bottom-[max(1rem,env(safe-area-inset-bottom))]"
            title={t('addList')}
            aria-label={t('addListFabAria')}
            aria-expanded={fabAddOpen}
            aria-haspopup="dialog"
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
          {fabAddOpen && (
            <>
              <div
                className="sm:hidden fixed inset-0 z-[90] bg-black/30 dark:bg-black/50"
                aria-hidden
                onClick={() => setFabAddOpen(false)}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label={t('addListFabMenuAria')}
                className="sm:hidden fixed left-0 right-0 bottom-0 z-[95] rounded-t-2xl border border-gray-300/80 dark:border-gray-700/80 border-b-0 bg-white dark:bg-gray-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl shadow-gray-900/15 dark:shadow-black/60"
              >
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">{t('addListFabMenuTitle')}</p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleFabAddEmpty}
                    className="w-full rounded-lg border border-indigo-500/50 dark:border-indigo-600/50 bg-indigo-100/40 dark:bg-indigo-950/40 px-4 py-3 text-left text-sm font-medium text-indigo-900 dark:text-indigo-100 hover:bg-indigo-200/80 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    {t('addListEmpty')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fabImportInputRef.current?.click();
                      setFabAddOpen(false);
                    }}
                    className="w-full rounded-lg border border-gray-400 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/90 px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-300/80 dark:hover:bg-gray-700/80 transition-colors"
                  >
                    {t('addListImportJson')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFabAddOpen(false)}
                    className="w-full rounded-lg px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
      <GamificationToasts />
      <MoviesMilestoneModal />
    </div>
  );
}
