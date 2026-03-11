import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  posterUrl,
  profileUrl,
  IMAGE_BASE_URL,
  getTrendingMovies,
  searchMovies,
  getMovieDetails,
  getActorDetails,
  getActorMovieCredits,
  getMovieCredits,
} from './tmdb';

describe('posterUrl', () => {
  it('returns full URL for non-null path with default size', () => {
    expect(posterUrl('/abc123')).toBe(`${IMAGE_BASE_URL}/w342/abc123`);
  });

  it('returns full URL for given size w185', () => {
    expect(posterUrl('/path', 'w185')).toBe(`${IMAGE_BASE_URL}/w185/path`);
  });

  it('returns full URL for given size w500', () => {
    expect(posterUrl('/path', 'w500')).toBe(`${IMAGE_BASE_URL}/w500/path`);
  });

  it('returns full URL for original size', () => {
    expect(posterUrl('/path', 'original')).toBe(`${IMAGE_BASE_URL}/original/path`);
  });

  it('returns empty string for null path', () => {
    expect(posterUrl(null)).toBe('');
  });

  it('returns empty string for empty string path', () => {
    expect(posterUrl('')).toBe('');
  });
});

describe('profileUrl', () => {
  it('returns full URL for non-null path with default size', () => {
    expect(profileUrl('/face')).toBe(`${IMAGE_BASE_URL}/w185/face`);
  });

  it('returns full URL for given size h632', () => {
    expect(profileUrl('/path', 'h632')).toBe(`${IMAGE_BASE_URL}/h632/path`);
  });

  it('returns full URL for original size', () => {
    expect(profileUrl('/path', 'original')).toBe(`${IMAGE_BASE_URL}/original/path`);
  });

  it('returns empty string for null path', () => {
    expect(profileUrl(null)).toBe('');
  });
});

describe('TMDB API functions', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getTrendingMovies fetches correct URL and returns results', async () => {
    const movies = [{ id: 1, title: 'Trending' }];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: movies }),
    });

    const result = await getTrendingMovies();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://api.themoviedb.org/3/trending/movie/week');
    expect(url.searchParams.get('api_key')).toBeTruthy();
    expect(result).toEqual(movies);
  });

  it('searchMovies fetches with query and returns results', async () => {
    const movies = [{ id: 2, title: 'Found' }];
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: movies }),
    });

    const result = await searchMovies('inception');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/3/search/movie');
    expect(url.searchParams.get('query')).toBe('inception');
    expect(result).toEqual(movies);
  });

  it('searchMovies returns empty array for empty or whitespace query', async () => {
    const resultEmpty = await searchMovies('');
    const resultWhitespace = await searchMovies('   ');
    expect(resultEmpty).toEqual([]);
    expect(resultWhitespace).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('getMovieDetails fetches movie with credits param', async () => {
    const movieWithCredits = { id: 10, title: 'Movie', credits: { id: 10, cast: [] } };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(movieWithCredits),
    });

    const result = await getMovieDetails(10);

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/3/movie/10');
    expect(url.searchParams.get('append_to_response')).toBe('credits');
    expect(result).toEqual(movieWithCredits);
  });

  it('getActorDetails fetches person endpoint', async () => {
    const actor = { id: 5, name: 'Actor', popularity: 1, profile_path: null };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(actor),
    });

    const result = await getActorDetails(5);

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/3/person/5');
    expect(result).toEqual(actor);
  });

  it('getMovieCredits fetches credits endpoint', async () => {
    const credits = { id: 1, cast: [] };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(credits),
    });

    const result = await getMovieCredits(1);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/3/movie/1/credits');
    expect(result).toEqual(credits);
  });

  it('getActorMovieCredits fetches person movie_credits', async () => {
    const actorCredits = { id: 5, cast: [] };
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(actorCredits),
    });

    const result = await getActorMovieCredits(5);
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/3/person/5/movie_credits');
    expect(result).toEqual(actorCredits);
  });

  it('throws on non-ok response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getTrendingMovies()).rejects.toThrow('TMDB API error: 404 Not Found');
  });
});
