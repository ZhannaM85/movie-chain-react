import type { Movie, Actor, MovieCredits, ActorMovieCredits } from '../types/movie';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string;
const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/**
 * Builds a full TMDB poster image URL for the given path and size.
 *
 * @param {string | null} path - The poster path returned by TMDB.
 * @param {'w185' | 'w342' | 'w500' | 'original'} [size='w342'] - The desired image size.
 * @returns {string} The fully-qualified image URL or an empty string if no path is provided.
 */
export function posterUrl(path: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w342'): string {
  if (!path) return '';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

/**
 * Builds a full TMDB profile image URL for the given path and size.
 *
 * @param {string | null} path - The profile path returned by TMDB.
 * @param {'w185' | 'h632' | 'original'} [size='w185'] - The desired image size.
 * @returns {string} The fully-qualified image URL or an empty string if no path is provided.
 */
export function profileUrl(path: string | null, size: 'w185' | 'h632' | 'original' = 'w185'): string {
  if (!path) return '';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

/**
 * Low-level helper for calling the TMDB API with the configured API key.
 *
 * @template T The expected response payload type.
 * @param {string} endpoint - The TMDB endpoint path (e.g. `/movie/123`).
 * @param {Record<string, string>} [params={}] - Additional query string parameters.
 * @returns {Promise<T>} The parsed JSON response.
 * @throws {Error} When the HTTP response is not OK.
 */
async function fetchTmdb<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', API_KEY);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Fetches the weekly trending movies from TMDB.
 *
 * @returns {Promise<Movie[]>} A list of trending movies.
 */
export async function getTrendingMovies(): Promise<Movie[]> {
  const data = await fetchTmdb<{ results: Movie[] }>('/trending/movie/week');
  return data.results;
}

/**
 * Searches TMDB for movies matching the given query.
 *
 * @param {string} query - The search string entered by the user.
 * @returns {Promise<Movie[]>} Matching movies, or an empty array for blank queries.
 */
export async function searchMovies(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];
  const data = await fetchTmdb<{ results: Movie[] }>('/search/movie', { query });
  return data.results;
}

/**
 * Fetches detailed information for a movie, including credits.
 *
 * @param {number} movieId - The TMDB movie identifier.
 * @returns {Promise<Movie & { credits: MovieCredits }>} The movie with attached credits.
 */
export async function getMovieDetails(movieId: number): Promise<Movie & { credits: MovieCredits }> {
  return fetchTmdb<Movie & { credits: MovieCredits }>(`/movie/${movieId}`, {
    append_to_response: 'credits',
  });
}

/**
 * Fetches the cast credits for a given movie.
 *
 * @param {number} movieId - The TMDB movie identifier.
 * @returns {Promise<MovieCredits>} The movie credits payload.
 */
export async function getMovieCredits(movieId: number): Promise<MovieCredits> {
  return fetchTmdb<MovieCredits>(`/movie/${movieId}/credits`);
}

/**
 * Fetches detailed information about a specific actor.
 *
 * @param {number} personId - The TMDB person identifier.
 * @returns {Promise<Actor>} The actor details.
 */
export async function getActorDetails(personId: number): Promise<Actor> {
  return fetchTmdb<Actor>(`/person/${personId}`);
}

/**
 * Fetches the movie credits for a specific actor.
 *
 * @param {number} personId - The TMDB person identifier.
 * @returns {Promise<ActorMovieCredits>} The actor's movie credits payload.
 */
export async function getActorMovieCredits(personId: number): Promise<ActorMovieCredits> {
  return fetchTmdb<ActorMovieCredits>(`/person/${personId}/movie_credits`);
}
