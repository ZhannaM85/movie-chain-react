import type { Movie, Actor, MovieCredits, ActorMovieCredits } from '../types/movie';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string;
const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export function posterUrl(path: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w342'): string {
  if (!path) return '';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function profileUrl(path: string | null, size: 'w185' | 'h632' | 'original' = 'w185'): string {
  if (!path) return '';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

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

export async function getTrendingMovies(): Promise<Movie[]> {
  const data = await fetchTmdb<{ results: Movie[] }>('/trending/movie/week');
  return data.results;
}

export async function searchMovies(query: string): Promise<Movie[]> {
  if (!query.trim()) return [];
  const data = await fetchTmdb<{ results: Movie[] }>('/search/movie', { query });
  return data.results;
}

export async function getMovieDetails(movieId: number): Promise<Movie & { credits: MovieCredits }> {
  return fetchTmdb<Movie & { credits: MovieCredits }>(`/movie/${movieId}`, {
    append_to_response: 'credits',
  });
}

export async function getMovieCredits(movieId: number): Promise<MovieCredits> {
  return fetchTmdb<MovieCredits>(`/movie/${movieId}/credits`);
}

export async function getActorDetails(personId: number): Promise<Actor> {
  return fetchTmdb<Actor>(`/person/${personId}`);
}

export async function getActorMovieCredits(personId: number): Promise<ActorMovieCredits> {
  return fetchTmdb<ActorMovieCredits>(`/person/${personId}/movie_credits`);
}
