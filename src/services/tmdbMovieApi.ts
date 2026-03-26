import type { MovieApi } from './movieApi';
import {
  getTrendingMovies,
  searchMovies,
  getMovieLocaleSnapshot,
  getMovieDetails,
  getMovieCredits,
  getActorDetails,
  getActorMovieCredits,
  posterUrl as tmdbPosterUrl,
  profileUrl as tmdbProfileUrl,
} from './tmdb';

export function createTmdbApi(): MovieApi {
  return {
    source: 'tmdb',
    getTrendingMovies,
    searchMovies,
    getMovieLocaleSnapshot,
    getMovieDetails,
    getMovieCredits,
    getActorDetails,
    getActorMovieCredits,
    posterUrl: (path, size) => tmdbPosterUrl(path, (size as 'w185' | 'w342' | 'w500' | 'original') ?? 'w342'),
    profileUrl: (path, size) => tmdbProfileUrl(path, (size as 'w185' | 'h632' | 'original') ?? 'w185'),
  };
}
