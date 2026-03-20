import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MovieCard from './MovieCard';
import type { Movie } from '../types/movie';
import { MovieApiProvider } from '../context/MovieApiContext';
import { ChainProvider } from '../context/ChainContext';

vi.mock('../services/movieApiClient', () => ({
  getMovieApi: vi.fn().mockResolvedValue({
    source: 'tmdb',
    posterUrl: (path: string | null, size: string) =>
      path ? `https://image.tmdb.org/t/p/${size}${path}` : '',
    profileUrl: () => '',
    getTrendingMovies: vi.fn(),
    searchMovies: vi.fn(),
    getMovieDetails: vi.fn(),
    getMovieCredits: vi.fn(),
    getActorDetails: vi.fn(),
    getActorMovieCredits: vi.fn(),
  }),
  getMovieApiForSource: vi.fn().mockReturnValue({
    source: 'tmdb',
    posterUrl: (path: string | null, size: string) =>
      path ? `https://image.tmdb.org/t/p/${size}${path}` : '',
    profileUrl: () => '',
    getTrendingMovies: vi.fn(),
    searchMovies: vi.fn(),
    getMovieDetails: vi.fn(),
    getMovieCredits: vi.fn(),
    getActorDetails: vi.fn(),
    getActorMovieCredits: vi.fn(),
  }),
}));

const minimalMovie: Movie = {
  id: 42,
  title: 'Test Movie',
  overview: 'A test overview.',
  poster_path: null,
  backdrop_path: null,
  release_date: '',
  vote_average: 0,
  vote_count: 0,
  popularity: 0,
};

function renderWithRouter(movie: Movie, showLink = true) {
  return render(
    <MemoryRouter>
      <MovieApiProvider>
        <ChainProvider>
          <MovieCard movie={movie} showLink={showLink} />
        </ChainProvider>
      </MovieApiProvider>
    </MemoryRouter>
  );
}

describe('MovieCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and overview', async () => {
    renderWithRouter(minimalMovie);
    await waitFor(() => {
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
    });
    expect(screen.getByText('A test overview.')).toBeInTheDocument();
  });

  it('shows N/A for year when release_date is empty', async () => {
    renderWithRouter(minimalMovie);
    await waitFor(() => expect(screen.getByText('N/A')).toBeInTheDocument());
  });

  it('shows parsed year when release_date is set', async () => {
    renderWithRouter({ ...minimalMovie, release_date: '2019-06-15' });
    await waitFor(() => expect(screen.getByText('2019')).toBeInTheDocument());
  });

  it('shows rating dash when vote_average is 0', async () => {
    renderWithRouter(minimalMovie);
    await waitFor(() => expect(screen.getByText('—')).toBeInTheDocument());
  });

  it('shows formatted rating when vote_average is set', async () => {
    renderWithRouter({ ...minimalMovie, vote_average: 8.3 });
    await waitFor(() => expect(screen.getByText('8.3')).toBeInTheDocument());
  });

  it('shows No Poster when poster_path is null', async () => {
    renderWithRouter(minimalMovie);
    await waitFor(() => expect(screen.getByText('No Poster')).toBeInTheDocument());
  });

  it('renders poster image when poster_path is set', async () => {
    const movieWithPoster = { ...minimalMovie, poster_path: '/poster.jpg' };
    renderWithRouter(movieWithPoster);
    const img = await screen.findByRole('img', { name: 'Test Movie' });
    expect(img).toHaveAttribute('src', expect.stringContaining('/poster.jpg'));
  });

  it('wraps content in Link to /movie/:id when showLink is true', async () => {
    renderWithRouter(minimalMovie, true);
    const link = await screen.findByRole('link', { name: /test movie/i });
    expect(link).toHaveAttribute('href', '/movie/42');
  });

  it('does not render a link when showLink is false', async () => {
    renderWithRouter(minimalMovie, false);
    await waitFor(() => expect(screen.getByText('Test Movie')).toBeInTheDocument());
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders genres when provided', async () => {
    renderWithRouter({
      ...minimalMovie,
      genres: [
        { id: 1, name: 'Drama' },
        { id: 2, name: 'Thriller' },
      ],
    });
    await waitFor(() => {
      expect(screen.getByText('Drama')).toBeInTheDocument();
      expect(screen.getByText('Thriller')).toBeInTheDocument();
    });
  });

  it('shows runtime when provided', async () => {
    renderWithRouter({ ...minimalMovie, runtime: 120 });
    await waitFor(() => expect(screen.getByText('120 min')).toBeInTheDocument());
  });
});
