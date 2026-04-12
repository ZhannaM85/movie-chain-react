import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Route } from '@playwright/test';
import {
  actor200Details,
  actor200MovieCredits,
  movie100Details,
} from './tmdbFixtures';
import { registerTmdbImageMocks } from './mockTmdbImages';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots');

const chainListsPickActor = {
  version: 1 as const,
  activeListId: 'e2e-list-1',
  lists: [
    {
      id: 'e2e-list-1',
      name: 'E2E',
      heatmapListRunId: 0,
      state: {
        source: 'tmdb' as const,
        links: [
          {
            movie: {
              id: 100,
              title: 'E2E Chain Movie',
              overview: '',
              poster_path: '/e2e-p.jpg',
              backdrop_path: null,
              release_date: '2020-01-01',
              vote_average: 7,
              vote_count: 100,
              popularity: 50,
            },
            connectingActorId: null,
            connectingActorName: null,
            comment: '',
            loggedDate: '2020-01-01',
            entryKind: 'start' as const,
          },
        ],
        currentStep: 'pick-actor' as const,
        selectedActorId: null,
        selectedActorName: null,
        prependMode: false,
        dailyChallengeDate: null,
      },
    },
  ],
};

const chainListsPickMovie = {
  version: 1 as const,
  activeListId: 'e2e-list-1',
  lists: [
    {
      id: 'e2e-list-1',
      name: 'E2E',
      heatmapListRunId: 0,
      state: {
        source: 'tmdb' as const,
        links: [
          {
            movie: {
              id: 100,
              title: 'E2E Chain Movie',
              overview: '',
              poster_path: '/e2e-p.jpg',
              backdrop_path: null,
              release_date: '2020-01-01',
              vote_average: 7,
              vote_count: 100,
              popularity: 50,
            },
            connectingActorId: null,
            connectingActorName: null,
            comment: '',
            loggedDate: '2020-01-01',
            entryKind: 'start' as const,
          },
        ],
        currentStep: 'pick-movie' as const,
        selectedActorId: 200,
        selectedActorName: 'E2E Actor',
        prependMode: false,
        dailyChallengeDate: null,
      },
    },
  ],
};

const uiPrefsRandomActors = JSON.stringify({
  strictListOrderActors: false,
  strictListOrderMovies: false,
  randomSinglePickActors: true,
  randomSinglePickMovies: false,
});

const uiPrefsRandomMovies = JSON.stringify({
  strictListOrderActors: false,
  strictListOrderMovies: false,
  randomSinglePickActors: false,
  randomSinglePickMovies: true,
});

async function fulfillTmdb(route: Route) {
  const u = route.request().url();
  /** Bootstrap: `getMovieApi()` probes TMDB with trending before the app mounts. */
  if (u.includes('/trending/movie/week')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            id: 999,
            title: 'Trending Placeholder',
            overview: '',
            poster_path: '/t.jpg',
            backdrop_path: null,
            release_date: '2021-01-01',
            vote_average: 8,
            vote_count: 1,
            popularity: 99,
          },
        ],
      }),
    });
    return;
  }
  if (u.includes('/movie/100') && u.includes('append_to_response')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(movie100Details),
    });
    return;
  }
  if (u.includes('/person/200/movie_credits')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(actor200MovieCredits),
    });
    return;
  }
  if (/\/person\/200(\?|$)/.test(u) && !u.includes('movie_credits')) {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(actor200Details),
    });
    return;
  }
  await route.continue();
}

test.describe('random single pick', () => {
  test('actor step: only one selectable card when random single pick is on', async ({
    page,
  }, testInfo) => {
    await registerTmdbImageMocks(page);
    await page.route('https://api.themoviedb.org/3/**', fulfillTmdb);
    await page.addInitScript(
      ([listsJson, uiJson]) => {
        localStorage.setItem('movie-chain-lists-v1', listsJson);
        localStorage.setItem('movie-chain-ui-v1', uiJson);
        Math.random = () => 0;
      },
      [JSON.stringify(chainListsPickActor), uiPrefsRandomActors]
    );

    await page.goto('/#/');

    await expect(page.locator('[data-selectable="true"]')).toHaveCount(1, { timeout: 15_000 });

    await page.screenshot({
      path: path.join(screenshotDir, `random-single-actor-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });

  test('movie step: only one selectable card when random single pick is on', async ({
    page,
  }, testInfo) => {
    await registerTmdbImageMocks(page);
    await page.route('https://api.themoviedb.org/3/**', fulfillTmdb);
    await page.addInitScript(
      ([listsJson, uiJson]) => {
        localStorage.setItem('movie-chain-lists-v1', listsJson);
        localStorage.setItem('movie-chain-ui-v1', uiJson);
        Math.random = () => 0;
      },
      [JSON.stringify(chainListsPickMovie), uiPrefsRandomMovies]
    );

    await page.goto('/#/');

    await expect(page.locator('[data-selectable="true"]')).toHaveCount(1, { timeout: 15_000 });

    await expect(page.getByText('Bravo')).toBeVisible();

    await page.screenshot({
      path: path.join(screenshotDir, `random-single-movie-${testInfo.project.name}.png`),
      fullPage: true,
    });
  });
});
