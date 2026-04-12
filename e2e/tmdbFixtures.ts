/** Minimal TMDB-shaped payloads for e2e (mocked fetch). */

export const movie100Details = {
  id: 100,
  title: 'E2E Chain Movie',
  overview: '',
  poster_path: '/e2e-p.jpg',
  backdrop_path: null,
  release_date: '2020-01-01',
  vote_average: 7,
  vote_count: 100,
  popularity: 50,
  credits: {
    id: 100,
    cast: [
      {
        id: 1,
        name: 'Cast One',
        profile_path: '/c1.jpg',
        popularity: 10,
        order: 0,
        known_for_department: 'Acting',
      },
      {
        id: 2,
        name: 'Cast Two',
        profile_path: '/c2.jpg',
        popularity: 9,
        order: 1,
        known_for_department: 'Acting',
      },
      {
        id: 3,
        name: 'Cast Three',
        profile_path: '/c3.jpg',
        popularity: 8,
        order: 2,
        known_for_department: 'Acting',
      },
    ],
  },
};

function movieCredit(
  id: number,
  title: string,
  popularity: number
): Record<string, unknown> {
  return {
    id,
    title,
    overview: '',
    poster_path: `/m${id}.jpg`,
    backdrop_path: null,
    release_date: '2019-06-01',
    vote_average: 6,
    vote_count: 50,
    popularity,
    genre_ids: [18],
  };
}

/** Filmography for person 200 — popularity order after client sort: 302, 301, 303, 304 */
export const actor200MovieCredits = {
  id: 200,
  cast: [
    movieCredit(301, 'Alpha', 90),
    movieCredit(302, 'Bravo', 100),
    movieCredit(303, 'Charlie', 80),
    movieCredit(304, 'Delta', 70),
  ],
};

export const actor200Details = {
  id: 200,
  name: 'E2E Actor',
  profile_path: '/a200.jpg',
  popularity: 15,
};
