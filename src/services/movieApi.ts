import type { Movie, Actor, MovieCredits, ActorMovieCredits, MovieSource } from '../types/movie';

export type { MovieSource };

export interface MovieApi {
  readonly source: MovieSource;
  getTrendingMovies(): Promise<Movie[]>;
  searchMovies(query: string): Promise<Movie[]>;
  /** Localized movie fields for the current UI language (no credits) — for chain list titles. */
  getMovieLocaleSnapshot(movieId: number): Promise<Movie>;
  getMovieDetails(movieId: number): Promise<Movie & { credits: MovieCredits }>;
  getMovieCredits(movieId: number): Promise<MovieCredits>;
  getActorDetails(personId: number): Promise<Actor>;
  getActorMovieCredits(personId: number): Promise<ActorMovieCredits>;
  posterUrl(path: string | null, size?: string): string;
  profileUrl(path: string | null, size?: string): string;
}
