import type { Movie, Actor, MovieCredits, ActorMovieCredits } from '../types/movie';
import type { MovieApi } from './movieApi';
import i18n from '../i18n';
import { cacheGet, cacheSet, TTL_ENTITY_MS, TTL_LIST_MS } from './apiResponseCache';

const API_KEY = import.meta.env.VITE_KINOPOISK_API_KEY as string;
const BASE_URL = 'https://kinopoiskapiunofficial.tech';

const isRu = () => (i18n.resolvedLanguage ?? i18n.language ?? 'en-US').toLowerCase().startsWith('ru');

function localeSegment(): string {
  return (i18n.resolvedLanguage ?? i18n.language ?? 'en-US').replace(/[^a-z0-9-]/gi, '_');
}

function pickTitle(nameRu: string | null, nameEn: string | null): string {
  if (isRu() && nameRu) return nameRu;
  if (nameEn) return nameEn;
  return nameRu ?? nameEn ?? '';
}

interface KpFilmItem {
  kinopoiskId?: number;
  filmId?: number;
  nameRu?: string | null;
  nameEn?: string | null;
  nameOriginal?: string | null;
  year?: number | string | null;
  posterUrl?: string | null;
  posterUrlPreview?: string | null;
  ratingKinopoisk?: number | null;
  ratingImdb?: number | null;
  ratingImbd?: number | null;
  ratingKinopoiskVoteCount?: number | null;
  description?: string | null;
  filmLength?: number | null;
}

interface KpStaffItem {
  staffId: number;
  nameRu?: string | null;
  nameEn?: string | null;
  description?: string | null;
  posterUrl?: string | null;
  professionKey?: string;
}

interface KpPersonFilm {
  filmId: number;
  nameRu?: string | null;
  nameEn?: string | null;
  rating?: string | null;
  professionKey?: string;
}

function mapKpFilmToMovie(item: KpFilmItem): Movie {
  const id = item.kinopoiskId ?? item.filmId ?? 0;
  const year = item.year != null ? String(item.year) : '';
  const releaseDate = year ? `${year}-01-01` : '';
  const rating = item.ratingKinopoisk ?? item.ratingImdb ?? item.ratingImbd ?? 0;
  const voteCount = item.ratingKinopoiskVoteCount ?? 0;
  return {
    id,
    title: pickTitle(item.nameRu ?? null, item.nameEn ?? item.nameOriginal ?? null),
    overview: item.description ?? '',
    poster_path: item.posterUrl ?? item.posterUrlPreview ?? null,
    backdrop_path: null,
    release_date: releaseDate,
    vote_average: typeof rating === 'number' ? rating : parseFloat(String(rating)) || 0,
    vote_count: voteCount,
    popularity: voteCount,
    runtime: typeof item.filmLength === 'number' ? item.filmLength : undefined,
  };
}

function mapKpStaffToActor(item: KpStaffItem, character?: string): Actor {
  return {
    id: item.staffId,
    name: pickTitle(item.nameRu ?? null, item.nameEn ?? null),
    profile_path: item.posterUrl ?? null,
    character,
    popularity: 0,
    known_for_department: item.professionKey === 'ACTOR' ? 'Acting' : undefined,
  };
}

/** Merges concurrent identical fetches (e.g. React Strict Mode dev double-mount). */
const inFlightKp = new Map<string, Promise<unknown>>();

async function fetchKp<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  const key = url.toString();
  const existing = inFlightKp.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = (async (): Promise<T> => {
    const response = await fetch(key, {
      headers: { 'X-API-KEY': API_KEY },
    });
    if (!response.ok) {
      throw new Error(`Kinopoisk API error: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  })();

  inFlightKp.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlightKp.delete(key);
  }
}

function posterUrl(path: string | null, _size?: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path;
}

function profileUrl(path: string | null, _size?: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path;
}

const filmCache = new Map<number, Movie>();
const actorCache = new Map<number, Actor>();

const MAX_FILMOGRAPHY_FETCH = 12;

async function getFilmDetails(filmId: number): Promise<Movie> {
  const cached = filmCache.get(filmId);
  if (cached) return cached;
  const lsKey = `kp:${localeSegment()}:film:${filmId}`;
  const persisted = cacheGet<Movie>(lsKey);
  if (persisted) {
    filmCache.set(filmId, persisted);
    return persisted;
  }
  const data = await fetchKp<KpFilmItem>(`/api/v2.2/films/${filmId}`);
  const movie = mapKpFilmToMovie(data);
  filmCache.set(filmId, movie);
  cacheSet(lsKey, movie, TTL_ENTITY_MS);
  return movie;
}

function cacheActorsFromStaff(staff: KpStaffItem[]): void {
  for (const s of staff) {
    const actor = mapKpStaffToActor(s, s.description ?? undefined);
    actorCache.set(s.staffId, actor);
  }
}

export function createKinopoiskApi(): MovieApi {
  return {
    source: 'kinopoisk',
    posterUrl,
    profileUrl,

    async getTrendingMovies(): Promise<Movie[]> {
      const key = `kp:${localeSegment()}:trending:TOP_POPULAR`;
      const hit = cacheGet<Movie[]>(key);
      if (hit) return hit;
      const data = await fetchKp<{ items: KpFilmItem[] }>(
        '/api/v2.2/films/collections',
        { type: 'TOP_POPULAR_MOVIES', page: '1' }
      );
      const list = (data.items ?? []).map(mapKpFilmToMovie);
      cacheSet(key, list, TTL_LIST_MS);
      return list;
    },

    async searchMovies(query: string): Promise<Movie[]> {
      const q = query.trim();
      if (!q) return [];
      const key = `kp:${localeSegment()}:search:${q.toLowerCase().slice(0, 200)}`;
      const hit = cacheGet<Movie[]>(key);
      if (hit) return hit;
      const data = await fetchKp<{ films: KpFilmItem[] }>(
        '/api/v2.1/films/search-by-keyword',
        { keyword: q, page: '1' }
      );
      const list = (data.films ?? []).map(mapKpFilmToMovie);
      cacheSet(key, list, TTL_LIST_MS);
      return list;
    },

    async getMovieDetails(movieId: number): Promise<Movie & { credits: MovieCredits }> {
      const key = `kp:${localeSegment()}:movie:${movieId}`;
      const hit = cacheGet<Movie & { credits: MovieCredits }>(key);
      if (hit) {
        for (const a of hit.credits.cast) {
          actorCache.set(a.id, a);
        }
        return hit;
      }
      const [film, staffData] = await Promise.all([
        fetchKp<KpFilmItem>(`/api/v2.2/films/${movieId}`),
        fetchKp<KpStaffItem[]>(`/api/v1/staff`, { filmId: String(movieId) }),
      ]);
      const movie = mapKpFilmToMovie(film);
      const actors = (staffData ?? [])
        .filter((s) => s.professionKey === 'ACTOR')
        .map((s) => mapKpStaffToActor(s, s.description ?? undefined));
      cacheActorsFromStaff(staffData?.filter((s) => s.professionKey === 'ACTOR') ?? []);
      const result = {
        ...movie,
        credits: { id: movieId, cast: actors },
      };
      cacheSet(key, result, TTL_ENTITY_MS);
      filmCache.set(movieId, movie);
      cacheSet(`kp:${localeSegment()}:film:${movieId}`, movie, TTL_ENTITY_MS);
      return result;
    },

    async getMovieCredits(movieId: number): Promise<MovieCredits> {
      const key = `kp:${localeSegment()}:credits:${movieId}`;
      const hit = cacheGet<MovieCredits>(key);
      if (hit) {
        for (const a of hit.cast) {
          actorCache.set(a.id, a);
        }
        return hit;
      }
      const staffData = await fetchKp<KpStaffItem[]>(`/api/v1/staff`, {
        filmId: String(movieId),
      });
      const actors = (staffData ?? [])
        .filter((s) => s.professionKey === 'ACTOR')
        .map((s) => mapKpStaffToActor(s, s.description ?? undefined));
      cacheActorsFromStaff(staffData?.filter((s) => s.professionKey === 'ACTOR') ?? []);
      const credits = { id: movieId, cast: actors };
      cacheSet(key, credits, TTL_ENTITY_MS);
      return credits;
    },

    async getActorDetails(personId: number): Promise<Actor> {
      const cached = actorCache.get(personId);
      if (cached) return cached;
      const lsKey = `kp:${localeSegment()}:actor:${personId}`;
      const persisted = cacheGet<Actor>(lsKey);
      if (persisted) {
        actorCache.set(personId, persisted);
        return persisted;
      }
      const data = await fetchKp<
        KpStaffItem & { personId?: number; birthday?: string; birthplace?: string }
      >(`/api/v1/staff/${personId}`);
      const id = data.personId ?? data.staffId ?? personId;
      const actor = mapKpStaffToActor({ ...data, staffId: id });
      const result: Actor = {
        ...actor,
        id,
        biography: undefined,
        birthday: data.birthday ?? undefined,
        place_of_birth: data.birthplace ?? undefined,
      };
      actorCache.set(personId, result);
      cacheSet(lsKey, result, TTL_ENTITY_MS);
      return result;
    },

    async getActorMovieCredits(personId: number): Promise<ActorMovieCredits> {
      const key = `kp:${localeSegment()}:actorMovieCredits:${personId}`;
      const hit = cacheGet<ActorMovieCredits>(key);
      if (hit) {
        for (const m of hit.cast) {
          filmCache.set(m.id, m);
        }
        const actorPersisted = cacheGet<Actor>(`kp:${localeSegment()}:actor:${personId}`);
        if (actorPersisted) {
          actorCache.set(personId, actorPersisted);
        }
        return hit;
      }
      const data = await fetchKp<
        KpStaffItem & { personId?: number; birthday?: string; birthplace?: string; films?: KpPersonFilm[] }
      >(`/api/v1/staff/${personId}`);
      const id = data.personId ?? data.staffId ?? personId;
      const actor = mapKpStaffToActor({ ...data, staffId: id });
      const actorFull: Actor = {
        ...actor,
        id,
        biography: undefined,
        birthday: data.birthday ?? undefined,
        place_of_birth: data.birthplace ?? undefined,
      };
      actorCache.set(personId, actorFull);
      cacheSet(`kp:${localeSegment()}:actor:${personId}`, actorFull, TTL_ENTITY_MS);

      const films = data.films ?? [];
      const actorFilms = films.filter((f) => f.professionKey === 'ACTOR');
      const filmIds = actorFilms.map((f) => f.filmId);
      const movies: Movie[] = [];
      for (let i = 0; i < Math.min(filmIds.length, MAX_FILMOGRAPHY_FETCH); i++) {
        const m = await getFilmDetails(filmIds[i]).catch(() => null);
        if (m && m.poster_path && m.release_date) movies.push(m);
      }
      const out: ActorMovieCredits = { id: personId, cast: movies };
      cacheSet(key, out, TTL_ENTITY_MS);
      return out;
    },
  };
}

