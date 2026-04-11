import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const STORAGE_KEY = 'movie-chain-lang';
const SUPPORTED_LANGUAGES = ['en-US', 'ru-RU'] as const;

function getInitialLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored as (typeof SUPPORTED_LANGUAGES)[number])) {
    return stored;
  }

  const browser = navigator.language;
  if (browser.toLowerCase().startsWith('ru')) {
    return 'ru-RU';
  }
  return 'en-US';
}

const resources = {
  'en-US': {
    translation: {
      appName: 'Movie Chain',
      navHome: 'Home',
      navStats: 'Stats',
      navAbout: 'About',
      language: 'Language',
      themeSwitchToLight: 'Switch to light theme',
      themeSwitchToDark: 'Switch to dark theme',
      themeMenuLabel: 'Theme',
      chainCount_one: '{{count}} movie in chain',
      chainCount_other: '{{count}} movies in chain',
      /** Shorter header label on narrow screens (full phrase still in title/aria). */
      chainCountCompact: '{{count}} in chain',
      newChain: 'New Chain',
      clearChain: 'Clear chain',
      clearChainTooltip:
        'Remove all movies from this list only. Other lists are not changed.',
      addListFabAria: 'Add a list — empty or import from JSON',
      addListFabMenuAria: 'Choose how to add a list',
      addListFabMenuTitle: 'Add a list',
      addListEmpty: 'Add empty list',
      addListImportJson: 'Import from JSON…',
      addList: 'Add list',
      listExportJson: 'Export JSON',
      listExportCsv: 'Export CSV',
      renameList: 'Rename',
      deleteList: 'Delete',
      renameListPrompt: 'List name',
      newListNumbered: 'List {{n}}',
      confirmDeleteListEmpty: 'Delete list "{{name}}"?',
      confirmDeleteListRecap:
        'Delete list "{{name}}"? It has {{length}} movies, {{difficulty}} challenge points, {{actors}} unique connecting actors, {{decades}} decades spanned.',
      chainListMenuAria: 'Movie lists',
      listNameEmpty: 'Name cannot be empty.',
      confirmNewChain: 'Start a new chain? This will clear your current progress.',
      confirmNewChainRecap:
        'Start a new chain? Your current run: {{length}} movies, {{difficulty}} challenge points, {{actors}} unique connecting actors, {{decades}} decades spanned.',
      streakLabel_one: '{{count}} day streak',
      streakLabel_other: '{{count}} day streak',
      streakTooltip: 'Consecutive local calendar days you played',
      challengePointsShort: '{{points}} pts',
      challengePointsTooltip:
        'Points for this chain step (0–21): fewer votes on the movie, lower movie popularity, and a less famous connecting actor each add points. 21 is a “max difficulty” step.',
      challengePointsInlineAria:
        '{{points}} challenge points. Tap or click for how step scoring works.',
      challengePointsTotalTooltip:
        'Total difficulty points from every step in your current chain (each step adds 0–21 based on votes, popularity, and how famous the connecting actor is).',
      challengePointsTotalInlineAria:
        '{{points}} total challenge points. Tap or click for details.',
      challengePointsActorOnlyTooltip:
        'Actor part of this step (0–10): less famous actors earn more. The film you pick next adds the rest (0–11 from votes and movie popularity). Full step is 0–21.',
      challengePointsActorOnlyInlineAria:
        '{{points}} points from the actor so far. Tap or click for how this relates to the full step score.',
      prependLinkChallengePointsHint:
        'Same for every film below — scoring uses the current chain head and this actor.',
      bestChainShort: 'Best: {{count}}',
      bestChainTooltip: 'Longest chain you have built',
      bridgeActorNameFallback: 'Actor #{{id}}',
      bridgeActorResolving: 'Finding shared cast…',
      bridgeActorNameLoading: '…',
      challengePointsLabel: 'Challenge points',
      bestChainLabel: 'Personal best (links)',
      decadesSpanned: 'Decades',
      dailyChallengeTitle: "Today's challenge",
      dailyChallengeBest: 'Your best from this start: {{count}} movies',
      dailyChallengeCta: 'Start from this movie',
      notePromptMemory: 'A memory, scene, or quote…',
      notePromptWhy: 'Why this actor or movie?',
      notePromptOpinion: 'Hot take or rating…',
      toastPersonalBest: 'New personal best!',
      toastPersonalBestDesc: 'You beat your longest chain.',
      toastDismiss: 'Dismiss',
      moviesMilestoneModalTitle: 'Over {{count}} movies!',
      moviesMilestoneModalBody: 'Your longest chain has reached at least {{count}} movies.',
      moviesMilestoneModalCta: 'Great!',
      toastUnknownTitle: 'Unlocked',
      toastUnknownDesc: '',
      achievement: {
        chain_5: {
          title: 'Five links',
          desc: 'Your chain reached at least five movies.',
        },
        chain_10: {
          title: 'Ten links',
          desc: 'Double digits — impressive chain.',
        },
        chain_20: {
          title: 'Twenty links',
          desc: 'A marathon chain.',
        },
        first_note: {
          title: 'First note',
          desc: 'You wrote your first movie note.',
        },
        three_decades: {
          title: 'Time traveler',
          desc: 'Your chain spans at least three different decades.',
        },
        movies_milestone: {
          title: '{{count}} movies in a chain',
          desc: 'Your longest chain reached at least this many movies.',
        },
      },
      backToChain: 'Back to chain',
      navigateBackToStats: 'Navigate back to stats',
      noPoster: 'No Poster',
      noPhoto: 'No Photo',
      na: 'N/A',
      loadingMovieDetails: 'Loading movie details...',
      loadingMovie: 'Loading movie...',
      loadingActorDetails: 'Loading actor details...',
      loadingCast: 'Loading cast...',
      loadingFilmography: 'Loading filmography...',
      failedLoadMovieDetails: 'Failed to load movie details.',
      failedLoadActorDetails: 'Failed to load actor details.',
      failedLoadMovies: 'Failed to load movies',
      serviceUnavailableMessage:
        'The movie database could not be reached. The service may be temporarily unavailable.',
      serviceUnavailableRefresh: 'Refresh the page to try again.',
      apiKeyHintTmdbOnly: 'Set VITE_TMDB_API_KEY in your .env file.',
      failedLoadCast: 'Failed to load cast: {{error}}',
      failedLoadMoviesWithReason: 'Failed to load movies: {{error}}',
      sortPopularity: 'Sort: Popularity',
      sortTitleAsc: 'Sort: Title A-Z',
      sortTitleDesc: 'Sort: Title Z-A',
      sortDateNewest: 'Sort: Newest first',
      sortDateOldest: 'Sort: Oldest first',
      cast: 'Cast',
      knownFor: 'Known For',
      actorYourChainBridge: 'Movies you reached using this actor as a bridge',
      actorYourChainCast: 'Movies in your chain with this actor in the cast',
      actorDetailsToggle: 'Actor details',
      born: 'Born',
      votes: 'votes',
      asCharacter: 'as {{character}}',
      min: 'min',
      startTitle: 'Start Your Movie Chain',
      startSubtitle: 'Pick a movie to begin. Each next movie will be linked by a shared actor.',
      searchMoviePlaceholder: 'Search for a movie...',
      searchResults: 'Search Results',
      trendingThisWeek: 'Trending This Week',
      noMoviesForQuery: 'No movies found for "{{query}}"',
      tmdbKeyHint: 'Make sure your TMDB API key is set in the .env file.',
      apiKeyHint: 'Set VITE_TMDB_API_KEY in your .env file.',
      dataSourceTmdb: 'TMDB',
      dataSourceKinopoisk: 'Kinopoisk',
      useKinopoisk: 'Use Kinopoisk',
      useKinopoiskOff: 'TMDB',
      pickActorToContinue: 'Pick an actor to continue the chain',
      actorAlreadyUsedAsBridge: 'Already used as bridge: {{from}} → {{to}}',
      collapseActorsAria: 'Collapse actor list',
      expandActorsAria: 'Expand actor list',
      pickActorToPrepend:
        'Pick an actor from the first movie who also appears in the older film you will add',
      prependToChainBanner: 'Adding a movie before the first in your chain (older history).',
      addMovieBeforeChain: 'Add a movie before the first in the chain',
      addMovieBeforeChainBottom: 'Add a movie at the older end of the chain (before the first film)',
      showAllCast: 'Show all {{count}} cast members',
      pickFromFilmography: 'Pick a movie from their filmography',
      changeActor: 'Change actor',
      searchFilmography: 'Search filmography...',
      showAllMovies: 'Show all {{count}} movies',
      overviewReadMore: 'Read more',
      overviewShowLess: 'Show less',
      noMoreMoviesFromActor: 'No more movies available from this actor.',
      movieAlreadyInChainHint: 'Already in chain',
      movieAlreadyInChain: 'Already in your chain — pick another title.',
      noMatchingMovies: 'No movies matching "{{query}}"',
      yourNotes: 'Your Notes',
      edit: 'Edit',
      addNote: '+ Add a note about this movie',
      notePlaceholder: 'Write your thoughts about this movie...',
      save: 'Save',
      cancel: 'Cancel',
      chain: 'Chain',
      undo: 'Undo',
      noChainYet: 'No Chain Yet',
      startChain: 'Start a Chain',
      noChainDescription: 'Start building your movie chain to see it here.',
      yourMovieChain: 'Your Movie Chain',
      linkedMovies_one: '{{count}} movie linked together',
      linkedMovies_other: '{{count}} movies linked together',
      undoLast: 'Undo Last',
      removeFirstFromChain: 'Remove oldest',
      confirmUndoLastTitle: 'Remove the latest movie?',
      confirmUndoLastBody:
        'The most recently added film will be removed from the chain. Your saved stats (including bridge actors) will be updated. You cannot remove a movie from the middle of the chain.',
      confirmRemoveFirstTitle: 'Remove the first movie?',
      confirmRemoveFirstBody:
        'The oldest film in the chain will be removed. Your saved stats (including bridge actors) will be updated. You cannot remove a movie from the middle of the chain.',
      confirmRemoveMovie: 'Remove',
      aboutTitle: 'About Movie Chain',
      aboutIntro:
        'Movie Chain is a small learning project where you build a path of movies connected through shared cast. The UI is available in English and Russian; your chain, notes, and stats stay in this browser only.',
      aboutHowWorks: 'How the chain works',
      aboutStep1:
        'From the home screen, pick a starting movie (trending this week, search, or the daily challenge).',
      aboutStep2: 'From that movie, pick an actor from the cast grid.',
      aboutStep3: "Choose another movie from that actor's filmography to add the next link.",
      aboutStep4:
        "On the new movie, pick a different actor from the cast — you cannot reuse the actor who just linked you to this film.",
      aboutStep5:
        'Repeat to grow your chain. Open the Chain page for a full list of every film, the bridge actor between each pair, per-link challenge points, and optional logged dates for your activity stats.',
      aboutRules: 'Rules & constraints',
      aboutRule1: 'Each new movie must share an actor with the previous movie in the chain.',
      aboutRule2:
        'The connecting actor is shown between movies on the Chain page, so you can always see how you moved from one film to the next.',
      aboutRule3:
        'When choosing an actor on a movie, the actor who connected you to that movie is disabled — you must pick someone else.',
      aboutRule4:
        "Use Undo to remove the newest chain link, Remove oldest to drop the first film, or Change actor while browsing filmography to pick a different connector.",
      aboutRule5:
        'Notes, the chain, gamification data, and language choice are stored locally in your browser (localStorage).',
      aboutRule6:
        'You can prepend an older movie before the first film: choose an actor from the first movie who also appears in the earlier title you add.',
      aboutStatsTitle: 'Stats & achievements',
      aboutStatsIntro:
        'The Stats page summarizes your history on this device. Aside from loading posters and credits from the movie APIs, nothing is uploaded to a custom backend.',
      aboutStatsItem1:
        'Activity heatmap and streaks use each link’s logged date (it defaults to the day you added the film).',
      aboutStatsItem2:
        'Challenge points per step and in total, longest chain, top bridge actors, cast-frequency stats, and badges for milestones like chain length and spanning decades.',
      aboutStatsItem3:
        'The home screen can offer a daily challenge start movie and remember your best run length from that start.',
      aboutTech: 'Tech behind the scenes',
      aboutTechText:
        'React 19, TypeScript, Vite, Tailwind CSS, React Router, and react-i18next. Movie data comes from the TMDB API. Vitest covers important logic. Everything persists in localStorage on this device.',
      aboutDataTitle: 'Lists & backup',
      aboutDataExportHint:
        'Export the current list from the Chain page (JSON restores this app exactly; CSV is for spreadsheets only). To add lists from a backup file, choose Import from JSON in the list menu in the header, or tap the mobile add (+) button and pick import.',
      backupImportSuccess: 'Import completed successfully.',
      backupImportError: 'Could not read the backup file. Check that it is valid JSON from this app.',
      backupImportFileAria: 'Choose JSON backup file',
      aboutFooterBefore: 'Designed and implemented by',
      aboutFooterAfter: 'with love, passion, and Cursor',
      userStatsTitle: 'Your stats',
      userStatsSubtitle: 'Activity and records stored only in this browser.',
      strictListOrderSectionTitle: 'Strict list order',
      strictListOrderSectionIntro:
        'Optional: only the next pick in the current list order is clickable (skipping actors already used as bridges or movies already in the chain).',
      strictListOrderCastLabel: 'Cast list order',
      strictListOrderCastHint: 'Only the next actor in the cast list (after skipping bridge actors).',
      strictListOrderFilmographyLabel: 'Filmography order',
      strictListOrderFilmographyHint:
        'Only the next movie in the current sorted and filtered filmography (skipping titles already in the chain).',
      actorSequentialLockedHint: 'Pick the next actor in the list first',
      actorSequentialLockedAria: '{{name}}. Pick the next actor in the cast list first.',
      movieSequentialLockedHint: 'Pick the next title in the list first',
      movieSequentialLockedAria: '{{title}}. Pick the next movie in the list first.',
      statTotalMoviesLogged: 'Movies logged',
      statChallengePointsTotal: 'Challenge points (all time)',
      statLongestStreak: 'Longest streak',
      statCurrentStreak: 'Current streak',
      statDaysUtc: 'Local calendar days',
      heatmapSectionTitle: 'Movies per day',
      heatmapDayEmpty: '{{date}}: no movies',
      heatmapDayMovies: '{{date}}: {{count}} movies',
      heatmapStrikeRun: 'Run {{n}}',
      heatmapDayStrikePart: '{{run}}: {{count}}',
      heatmapStrikeBreakdownJoiner: '; ',
      heatmapStrikeLegendLabel: 'Chain runs:',
      heatmapLocalHint:
        'Each square is one calendar day. Columns are ISO weeks (Monday through Sunday, top to bottom); time goes left to right (older weeks on the left). Hue shows which chain run contributed the most that day: separate named lists get distinct colors, and clearing a list starts a new run. Older stats without a list split stay in “run 1” (green); mixed days favor newer runs for color while darkness still reflects the total count (see “logged date” per film).',
      loggedDateForStartMovie: 'Count first movie toward',
      loggedDateForNextMovie: 'Count next pick toward',
      loggedDateForPastMovie: 'Day for this older film',
      loggedDateShort: 'Stats day',
      chainWatchedOn: '{{date}}',
      loggedDateUnsetHint: 'Set a day to align with your activity graph.',
      editWatchedDateAria: 'Edit watched date',
      finishWatchedDateEditAria: 'Done editing date',
      statBusiestDay: 'Busiest day: {{date}} ({{count}} movies)',
      topActorsSectionTitle: 'Top bridge actors',
      topActorsEmpty: 'Play more chains — we will count which actors you pick most often to link films.',
      topCastSectionTitle: 'Top actors (full cast)',
      statsTopCastLoading: 'Loading cast stats…',
      topCastSectionHint:
        'Counts come from live cast lists for each film currently in your chain (including small roles, up to the first 200 billed cast). Each film counts once per actor. They refresh when you open this page.',
      topCastEmpty:
        'Open movies from your chain so we can read full credits. Your top “screen time” actors will show up here.',
      actorCastMovies_one: 'in {{count}} movie',
      actorCastMovies_other: 'in {{count}} movies',
      actorBridgeTimes_one: '{{count}}×',
      actorBridgeTimes_other: '{{count}}×',
      moreStatsSectionTitle: 'More',
      statLongestChain: 'Longest chain (links)',
      statAchievementsUnlocked: 'Achievements unlocked',
      statFirstNoteWritten: 'First movie note',
      statsHelpAria: 'How this is calculated',
      statExplainTotalMovies:
        'Total number of movies you added to chains in this browser. Starting a chain adds the first film; each link after that adds one more. Undo removes the last movie and updates totals.',
      statExplainChallengePoints:
        'Sum of difficulty points from every chain step where you picked a connecting actor and the next movie. Higher scores favor lower vote counts on the movie you step into, lower movie popularity, and lower popularity on the connecting actor. The first movie in a chain has no step score.',
      statExplainLongestStreak:
        'Your longest run of consecutive local calendar days that have at least one movie counted on the heatmap (same per-day counts as “Movies per day”).',
      statExplainCurrentStreak:
        'How many consecutive local calendar days with at least one logged movie, counting backward from your most recent activity day until a gap. Matches the heatmap.',
      heatmapSectionExplain:
        'Each cell is one local calendar day. Columns are weeks; earlier weeks appear to the left of later weeks. Color intensity shows how many movies count toward that day using each link’s “logged date” (defaults to today when you add the film). Different hues separate chain runs (each time you clear the list and start again, that is a new run). When a day mixes runs, the square uses the run with the most films that day.',
      statExplainBusiestDay:
        'The local calendar day on which the most movies were counted toward your activity (same per-day counts as the heatmap).',
      statExplainTopBridge:
        'Actors you chose as the shared connection between two consecutive movies in a chain. We count how often each actor was selected as that link.',
      statExplainTopCast:
        'These numbers are computed from the database cast lists for the films in your current chain (not from old cached data). Each film counts once if that actor appears in its credits. Change your chain or revisit this page to refresh.',
      statExplainMoreLongestChain:
        'The greatest number of movies you reached in a single chain (personal best length).',
      statExplainMoreAchievements:
        'How many achievement badges you have unlocked in this browser (chain length, decades, first note, etc.).',
      statAchievementsModalTitle: 'Achievements',
      statAchievementsModalClose: 'Close',
      statAchievementsModalEmpty: 'No achievements unlocked yet.',
      achievementLocked: 'Locked',
      achievementSectionUnlocked: 'Unlocked',
      achievementSectionLocked: 'Not yet unlocked',
      achievementSectionUnlockedEmpty: 'None yet — build longer chains, span decades, or add a note.',
      achievementSectionLockedEmpty: "You've unlocked every standard achievement. Nice work!",
      statExplainMoreFirstNote:
        'Whether you have saved at least one text note on a movie in a chain.',
      yes: 'Yes',
      no: 'No',
    },
  },
  'ru-RU': {
    translation: {
      appName: 'Movie Chain',
      navHome: 'Главная',
      navStats: 'Статистика',
      navAbout: 'О проекте',
      language: 'Язык',
      themeSwitchToLight: 'Светлая тема',
      themeSwitchToDark: 'Тёмная тема',
      themeMenuLabel: 'Тема',
      chainCount_one: '{{count}} фильм в цепочке',
      chainCount_few: '{{count}} фильма в цепочке',
      chainCount_many: '{{count}} фильмов в цепочке',
      chainCount_other: '{{count}} фильма в цепочке',
      chainCountCompact: '{{count}} в цеп.',
      newChain: 'Новая цепочка',
      clearChain: 'Очистить цепочку',
      clearChainTooltip:
        'Убрать все фильмы только из этого списка. Остальные списки не затрагиваются.',
      addListFabAria: 'Добавить список — пустой или импорт из JSON',
      addListFabMenuAria: 'Как добавить список',
      addListFabMenuTitle: 'Добавить список',
      addListEmpty: 'Пустой список',
      addListImportJson: 'Импорт из JSON…',
      addList: 'Добавить список',
      listExportJson: 'Экспорт JSON',
      listExportCsv: 'Экспорт CSV',
      renameList: 'Переименовать',
      deleteList: 'Удалить',
      renameListPrompt: 'Название списка',
      newListNumbered: 'Список {{n}}',
      confirmDeleteListEmpty: 'Удалить список «{{name}}»?',
      confirmDeleteListRecap:
        'Удалить список «{{name}}»? В нём {{length}} фильмов, {{difficulty}} очков сложности, {{actors}} уникальных актёров-связок, {{decades}} разных десятилетий.',
      chainListMenuAria: 'Списки фильмов',
      listNameEmpty: 'Название не может быть пустым.',
      confirmNewChain: 'Начать новую цепочку? Текущий прогресс будет очищен.',
      confirmNewChainRecap:
        'Начать новую цепочку? Текущая: {{length}} фильмов, {{difficulty}} очков сложности, {{actors}} уникальных актёров-связок, {{decades}} разных десятилетий.',
      streakLabel_one: 'Серия {{count}} день',
      streakLabel_few: 'Серия {{count}} дня',
      streakLabel_many: 'Серия {{count}} дней',
      streakLabel_other: 'Серия {{count}} дня',
      streakTooltip: 'Дни подряд с игрой (локальный календарь)',
      challengePointsShort: '{{points}} очк.',
      challengePointsTooltip:
        'Очки за этот шаг цепочки (0–21): меньше голосов у фильма, ниже популярность фильма и менее известный выбранный актёр-связка — больше очков. 21 — максимум за один шаг.',
      challengePointsInlineAria:
        '{{points}} очков сложности за шаг. Нажмите, чтобы прочитать, как считаются очки.',
      challengePointsTotalTooltip:
        'Сумма очков сложности по всем шагам текущей цепочки (за каждый шаг — от 0 до 21 в зависимости от голосов, популярности и известности актёра-связки).',
      challengePointsTotalInlineAria:
        '{{points}} очков сложности всего. Нажмите для пояснения.',
      challengePointsActorOnlyTooltip:
        'Часть за актёра в этом шаге (0–10): за менее известных — больше. Выбранный дальше фильм добавит остальное (0–11 по голосам и популярности фильма). Полный шаг — 0–21.',
      challengePointsActorOnlyInlineAria:
        '{{points}} очков за актёра на этом этапе. Нажмите, как это связано с полным шагом.',
      prependLinkChallengePointsHint:
        'Одинаково для любого фильма ниже — очки считаются по текущему началу цепочки и этому актёру.',
      bestChainShort: 'Рекорд: {{count}}',
      bestChainTooltip: 'Самая длинная цепочка',
      bridgeActorNameFallback: 'Актёр №{{id}}',
      bridgeActorResolving: 'Ищем общий состав…',
      bridgeActorNameLoading: '…',
      challengePointsLabel: 'Очки сложности',
      bestChainLabel: 'Личный рекорд (звеньев)',
      decadesSpanned: 'Десятилетий',
      dailyChallengeTitle: 'Задание дня',
      dailyChallengeBest: 'Ваш лучший результат с этого старта: {{count}} фильмов',
      dailyChallengeCta: 'Начать с этого фильма',
      notePromptMemory: 'Воспоминание, сцена или цитата…',
      notePromptWhy: 'Почему этот актёр или фильм?',
      notePromptOpinion: 'Мнение или оценка…',
      toastPersonalBest: 'Новый личный рекорд!',
      toastPersonalBestDesc: 'Вы побили длину самой длинной цепочки.',
      toastDismiss: 'Закрыть',
      moviesMilestoneModalTitle: 'Больше {{count}} фильмов!',
      moviesMilestoneModalBody: 'Самая длинная цепочка — не меньше {{count}} фильмов.',
      moviesMilestoneModalCta: 'Отлично!',
      toastUnknownTitle: 'Получено',
      toastUnknownDesc: '',
      achievement: {
        chain_5: {
          title: 'Пять звеньев',
          desc: 'В цепочке не меньше пяти фильмов.',
        },
        chain_10: {
          title: 'Десять звеньев',
          desc: 'Двузначная цепочка — отлично.',
        },
        chain_20: {
          title: 'Двадцать звеньев',
          desc: 'Марафонская цепочка.',
        },
        first_note: {
          title: 'Первая заметка',
          desc: 'Вы написали первую заметку к фильму.',
        },
        three_decades: {
          title: 'Путешественник во времени',
          desc: 'Цепочка охватывает не меньше трёх десятилетий.',
        },
        movies_milestone: {
          title: '{{count}} фильмов в цепочке',
          desc: 'Самая длинная цепочка достигла не меньше этого числа фильмов.',
        },
      },
      backToChain: 'Назад к цепочке',
      navigateBackToStats: 'Назад к статистике',
      noPoster: 'Нет постера',
      noPhoto: 'Нет фото',
      na: 'Н/Д',
      loadingMovieDetails: 'Загрузка информации о фильме...',
      loadingMovie: 'Загрузка фильма...',
      loadingActorDetails: 'Загрузка информации об актере...',
      loadingCast: 'Загрузка актерского состава...',
      loadingFilmography: 'Загрузка фильмографии...',
      failedLoadMovieDetails: 'Не удалось загрузить информацию о фильме.',
      failedLoadActorDetails: 'Не удалось загрузить информацию об актере.',
      failedLoadMovies: 'Не удалось загрузить фильмы',
      serviceUnavailableMessage:
        'База фильмов недоступна. Сервис может быть временно недоступен.',
      serviceUnavailableRefresh: 'Обновите страницу, чтобы попробовать снова.',
      apiKeyHintTmdbOnly: 'Укажите VITE_TMDB_API_KEY в файле .env.',
      failedLoadCast: 'Не удалось загрузить актерский состав: {{error}}',
      failedLoadMoviesWithReason: 'Не удалось загрузить фильмы: {{error}}',
      sortPopularity: 'Сортировка: популярность',
      sortTitleAsc: 'Сортировка: название А-Я',
      sortTitleDesc: 'Сортировка: название Я-А',
      sortDateNewest: 'Сортировка: сначала новые',
      sortDateOldest: 'Сортировка: сначала старые',
      cast: 'В ролях',
      knownFor: 'Известен по',
      actorYourChainBridge: 'Фильмы, к которым вы пришли через этого актёра как мост',
      actorYourChainCast: 'Фильмы в вашей цепочке, где этот актёр в актёрском составе',
      actorDetailsToggle: 'Сведения об актёре',
      born: 'Дата рождения',
      votes: 'голосов',
      asCharacter: 'в роли {{character}}',
      min: 'мин',
      startTitle: 'Начните свою цепочку фильмов',
      startSubtitle: 'Выберите фильм для начала. Каждый следующий фильм будет связан общим актером.',
      searchMoviePlaceholder: 'Найти фильм...',
      searchResults: 'Результаты поиска',
      trendingThisWeek: 'Популярное за неделю',
      noMoviesForQuery: 'По запросу "{{query}}" фильмы не найдены',
      tmdbKeyHint: 'Убедитесь, что TMDB API ключ указан в файле .env.',
      apiKeyHint: 'Укажите VITE_TMDB_API_KEY в файле .env.',
      dataSourceTmdb: 'TMDB',
      dataSourceKinopoisk: 'Кинопоиск',
      useKinopoisk: 'Кинопоиск',
      useKinopoiskOff: 'TMDB',
      pickActorToContinue: 'Выберите актера, чтобы продолжить цепочку',
      actorAlreadyUsedAsBridge: 'Уже был мостом: {{from}} → {{to}}',
      collapseActorsAria: 'Свернуть список актёров',
      expandActorsAria: 'Развернуть список актёров',
      pickActorToPrepend:
        'Выберите актёра из первого фильма, который также снимался в более раннем фильме, который вы добавите',
      prependToChainBanner: 'Добавление фильма перед первым в цепочке (более ранняя история).',
      addMovieBeforeChain: 'Добавить фильм перед первым в цепочке',
      addMovieBeforeChainBottom:
        'Добавить фильм в более ранний конец цепочки (перед первым фильмом)',
      showAllCast: 'Показать весь состав ({{count}})',
      pickFromFilmography: 'Выберите фильм из его фильмографии',
      changeActor: 'Сменить актера',
      searchFilmography: 'Поиск по фильмографии...',
      showAllMovies: 'Показать все фильмы ({{count}})',
      overviewReadMore: 'Показать полностью',
      overviewShowLess: 'Свернуть',
      noMoreMoviesFromActor: 'У этого актера больше нет доступных фильмов.',
      movieAlreadyInChainHint: 'Уже в цепочке',
      movieAlreadyInChain: 'Уже в вашей цепочке — выберите другой фильм.',
      noMatchingMovies: 'Нет фильмов по запросу "{{query}}"',
      yourNotes: 'Ваши заметки',
      edit: 'Редактировать',
      addNote: '+ Добавить заметку о фильме',
      notePlaceholder: 'Напишите ваши мысли об этом фильме...',
      save: 'Сохранить',
      cancel: 'Отмена',
      chain: 'Цепочка',
      undo: 'Отменить',
      noChainYet: 'Цепочка пока не начата',
      startChain: 'Начать цепочку',
      noChainDescription: 'Начните собирать цепочку фильмов, и она появится здесь.',
      yourMovieChain: 'Ваша цепочка фильмов',
      linkedMovies_one: '{{count}} фильм связан',
      linkedMovies_few: '{{count}} фильма связаны',
      linkedMovies_many: '{{count}} фильмов связаны',
      linkedMovies_other: '{{count}} фильма связаны',
      undoLast: 'Отменить последний',
      removeFirstFromChain: 'Убрать первый',
      confirmUndoLastTitle: 'Убрать последний фильм?',
      confirmUndoLastBody:
        'Самый недавно добавленный фильм будет удалён из цепочки. Сохранённая статистика (в том числе актёры-мосты) будет пересчитана. Удалять фильмы из середины цепочки нельзя.',
      confirmRemoveFirstTitle: 'Убрать первый фильм?',
      confirmRemoveFirstBody:
        'Самый старый фильм в цепочке будет удалён. Сохранённая статистика (в том числе актёры-мосты) будет пересчитана. Удалять фильмы из середины цепочки нельзя.',
      confirmRemoveMovie: 'Убрать',
      aboutTitle: 'О Movie Chain',
      aboutIntro:
        'Movie Chain — небольшой учебный проект: вы строите цепочку фильмов через общих актёров. Интерфейс на английском и русском; цепочка, заметки и статистика хранятся только в этом браузере.',
      aboutHowWorks: 'Как работает цепочка',
      aboutStep1:
        'На главном экране выберите стартовый фильм (популярное за неделю, поиск или задание дня).',
      aboutStep2: 'Из этого фильма выберите актёра в сетке состава.',
      aboutStep3: 'Выберите другой фильм из фильмографии этого актёра — это следующее звено.',
      aboutStep4:
        'В новом фильме выберите другого актёра — нельзя снова взять того, кто только что связал вас с этим фильмом.',
      aboutStep5:
        'Повторяйте, чтобы удлинять цепочку. Страница «Цепочка» показывает все фильмы, актёра-мост между соседними фильмами, очки сложности за шаг и при необходимости день для статистики.',
      aboutRules: 'Правила и ограничения',
      aboutRule1: 'Каждый новый фильм должен иметь общего актёра с предыдущим фильмом в цепочке.',
      aboutRule2:
        'Связующий актёр виден между фильмами на странице цепочки — всегда понятно, как вы перешли от одного фильма к другому.',
      aboutRule3:
        'При выборе актёра в фильме тот, кто привёл вас в этот фильм, недоступен — нужно выбрать другого.',
      aboutRule4:
        'Можно отменить последнее звено, убрать самый старый фильм в цепочке или сменить актёра в фильмографии и выбрать другую связку.',
      aboutRule5:
        'Заметки, цепочка, игровая статистика и язык интерфейса сохраняются локально в браузере (localStorage).',
      aboutRule6:
        'Можно добавить более ранний фильм перед первым: выберите актёра из первого фильма, который также снялся в более старом добавляемом фильме.',
      aboutStatsTitle: 'Статистика и достижения',
      aboutStatsIntro:
        'Страница статистики показывает историю только на этом устройстве. Кроме запросов к API фильмов, отдельного бэкенда проекта нет.',
      aboutStatsItem1:
        'Теплокарта и серии дней считаются по дате «учёта» у каждого звена (по умолчанию — день добавления фильма).',
      aboutStatsItem2:
        'Очки сложности за шаг и всего, длиннейшая цепочка, частые актёры-мосты, топ по полному составу и значки за рубежи вроде длины цепочки и десятилетий.',
      aboutStatsItem3:
        'На главной может быть задание дня со стартовым фильмом и локально сохраняется лучший результат с этого старта.',
      aboutTech: 'Технологии',
      aboutTechText:
        'React 19, TypeScript, Vite, Tailwind CSS, React Router и react-i18next. Данные о фильмах — TMDB API. Часть логики покрыта тестами Vitest. Всё хранится в localStorage на этом устройстве.',
      aboutDataTitle: 'Списки и резервные копии',
      aboutDataExportHint:
        'Экспортируйте текущий список на странице «Цепочка» (JSON восстанавливает приложение полностью; CSV — для таблиц). Чтобы добавить списки из файла, выберите «Импорт из JSON» в меню списков в шапке или на мобильной кнопке «+».',
      backupImportSuccess: 'Импорт выполнен успешно.',
      backupImportError: 'Не удалось прочитать файл. Убедитесь, что это JSON из этого приложения.',
      backupImportFileAria: 'Выбрать JSON-файл резервной копии',
      aboutFooterBefore: 'Дизайн и реализация:',
      aboutFooterAfter: 'с любовью, страстью и Cursor',
      userStatsTitle: 'Ваша статистика',
      userStatsSubtitle: 'Активность и рекорды хранятся только в этом браузере.',
      strictListOrderSectionTitle: 'Строгий порядок списка',
      strictListOrderSectionIntro:
        'По желанию: доступен только следующий выбор в текущем порядке списка (с пропуском актёров-мостов и фильмов, уже в цепочке).',
      strictListOrderCastLabel: 'Порядок в списке актёров',
      strictListOrderCastHint: 'Только следующий актёр в списке состава (после пропуска уже использованных мостов).',
      strictListOrderFilmographyLabel: 'Порядок в фильмографии',
      strictListOrderFilmographyHint:
        'Только следующий фильм в текущей сортировке и фильтре (с пропуском уже добавленных в цепочку).',
      actorSequentialLockedHint: 'Сначала выберите следующего актёра в списке',
      actorSequentialLockedAria: '{{name}}. Сначала выберите следующего актёра в списке состава.',
      movieSequentialLockedHint: 'Сначала выберите следующий фильм в списке',
      movieSequentialLockedAria: '{{title}}. Сначала выберите следующий фильм в списке.',
      statTotalMoviesLogged: 'Фильмов в цепочках',
      statChallengePointsTotal: 'Очки сложности (всего)',
      statLongestStreak: 'Самая длинная серия',
      statCurrentStreak: 'Текущая серия',
      statDaysUtc: 'локальные календарные дни',
      heatmapSectionTitle: 'Фильмов за день',
      heatmapDayEmpty: '{{date}}: нет фильмов',
      heatmapDayMovies: '{{date}}: {{count}} фильм.',
      heatmapStrikeRun: 'Заход {{n}}',
      heatmapDayStrikePart: '{{run}}: {{count}}',
      heatmapStrikeBreakdownJoiner: '; ',
      heatmapStrikeLegendLabel: 'Заходы цепочки:',
      heatmapLocalHint:
        'Каждый квадрат — один календарный день. Столбцы — календарные недели (пн–вс сверху вниз); время идёт слева направо (более ранние недели слева). Оттенок — какой заход цепочки дал больше всего в этот день: у отдельных именованных списков свои цвета, после очистки списка начинается новый заход. Старые данные без разбивки по спискам остаются в «заходе 1» (зелёный); в смешанные дни для цвета приоритет у более новых заходов, насыщенность по-прежнему от общего числа фильмов (см. «день» у каждого фильма).',
      loggedDateForStartMovie: 'Учитывать первый фильм за',
      loggedDateForNextMovie: 'Учитывать следующий выбор за',
      loggedDateForPastMovie: 'День для этого более раннего фильма',
      loggedDateShort: 'День в статистике',
      chainWatchedOn: '{{date}}',
      loggedDateUnsetHint: 'Укажите день, чтобы совпало с графиком активности.',
      editWatchedDateAria: 'Изменить дату просмотра',
      finishWatchedDateEditAria: 'Готово',
      statBusiestDay: 'Самый загруженный день: {{date}} ({{count}} фильм.)',
      topActorsSectionTitle: 'Частые «мосты» — актёры',
      topActorsEmpty: 'Играйте дольше — мы покажем, каких актёров вы чаще выбираете в качестве связки.',
      topCastSectionTitle: 'Топ актёров (полные титры)',
      statsTopCastLoading: 'Загрузка статистики по составу…',
      topCastSectionHint:
        'Счётчики считаются по актуальным спискам актёров для каждого фильма в текущей цепочке (включая эпизодические роли, до первых 200 в титрах). Каждый фильм учитывается один раз на актёра. Обновляются при открытии этой страницы.',
      topCastEmpty:
        'Откройте фильмы из цепочки, чтобы загрузить полный состав — здесь появятся самые частые по числу ваших фильмов.',
      actorCastMovies_one: 'в {{count}} фильме',
      actorCastMovies_few: 'в {{count}} фильмах',
      actorCastMovies_many: 'в {{count}} фильмах',
      actorCastMovies_other: 'в {{count}} фильмах',
      actorBridgeTimes_one: '{{count}}×',
      actorBridgeTimes_few: '{{count}}×',
      actorBridgeTimes_many: '{{count}}×',
      actorBridgeTimes_other: '{{count}}×',
      moreStatsSectionTitle: 'Ещё',
      statLongestChain: 'Длиннейшая цепочка (звеньев)',
      statAchievementsUnlocked: 'Достижений открыто',
      statFirstNoteWritten: 'Первая заметка к фильму',
      statsHelpAria: 'Как это считается',
      statExplainTotalMovies:
        'Сколько фильмов вы добавили в цепочки в этом браузере. Старт цепочки — первый фильм; каждое следующее звено добавляет ещё один. Отмена убирает последний фильм и обновляет счётчики.',
      statExplainChallengePoints:
        'Сумма очков сложности за каждый шаг цепочки, где вы выбрали связующего актёра и следующий фильм. Больше очков за более «сложные» шаги: меньше голосов у фильма, к которому вы переходите, ниже популярность фильма и ниже популярность актёра-связки. У первого фильма в цепочке нет шаговых очков.',
      statExplainLongestStreak:
        'Самая длинная серия подряд идущих календарных дней, в которые на теплокарте есть хотя бы один учтённый фильм (те же счётчики, что и «фильмов в день»).',
      statExplainCurrentStreak:
        'Сколько подряд календарных дней с хотя бы одним залогированным фильмом, считая назад от последнего дня с активностью до разрыва. Совпадает с теплокартой.',
      heatmapSectionExplain:
        'Каждая ячейка — один календарный день в вашем часовом поясе. Столбцы — недели; более ранние недели слева от более поздних. Насыщенность показывает, сколько фильмов учтено за этот день по полю «день» у звена (по умолчанию — день добавления). Разные оттенки разделяют заходы цепочки (каждый раз после полной очистки списка — новый заход). Если в один день несколько заходов, квадрат берёт тот, у которого больше фильмов в этот день.',
      statExplainBusiestDay:
        'Календарный день, в который учтено больше всего фильмов (те же счётчики, что и на теплокарте).',
      statExplainTopBridge:
        'Актёры, которых вы выбирали как общую связь между двумя соседними фильмами в цепочке. Считаем, сколько раз каждый актёр был такой связкой.',
      statExplainTopCast:
        'Числа считаются по спискам актёров из базы для фильмов текущей цепочки (не из устаревшего кэша). Каждый фильм учитывается один раз, если актёр есть в титрах. Измените цепочку или снова откройте страницу, чтобы обновить.',
      statExplainMoreLongestChain:
        'Максимальное число фильмов в одной цепочке за всё время (личный рекорд по длине).',
      statExplainMoreAchievements:
        'Сколько достижений открыто в этом браузере (длина цепочки, десятилетия, первая заметка и т.д.).',
      statAchievementsModalTitle: 'Достижения',
      statAchievementsModalClose: 'Закрыть',
      statAchievementsModalEmpty: 'Пока нет открытых достижений.',
      achievementLocked: 'Закрыто',
      achievementSectionUnlocked: 'Открыто',
      achievementSectionLocked: 'Ещё не открыто',
      achievementSectionUnlockedEmpty:
        'Пока нет — удлиняйте цепочку, охватывайте десятилетия или добавьте заметку.',
      achievementSectionLockedEmpty: 'Все стандартные достижения открыты — отличная работа!',
      statExplainMoreFirstNote:
        'Была ли сохранена хотя бы одна текстовая заметка к фильму в цепочке.',
      yes: 'Да',
      no: 'Нет',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en-US',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lang) => {
  localStorage.setItem(STORAGE_KEY, lang);
});

export default i18n;
