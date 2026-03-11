import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MovieCard from './MovieCard';
import type { Movie } from '../types/movie';

vi.mock('../services/tmdb', () => ({
  posterUrl: vi.fn((path: string | null, size: string) =>
    path ? `https://image.tmdb.org/t/p/${size}${path}` : ''
  ),
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
      <MovieCard movie={movie} showLink={showLink} />
    </MemoryRouter>
  );
}

describe('MovieCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and overview', () => {
    renderWithRouter(minimalMovie);
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText('A test overview.')).toBeInTheDocument();
  });

  it('shows N/A for year when release_date is empty', () => {
    renderWithRouter(minimalMovie);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('shows parsed year when release_date is set', () => {
    renderWithRouter({ ...minimalMovie, release_date: '2019-06-15' });
    expect(screen.getByText('2019')).toBeInTheDocument();
  });

  it('shows rating dash when vote_average is 0', () => {
    renderWithRouter(minimalMovie);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows formatted rating when vote_average is set', () => {
    renderWithRouter({ ...minimalMovie, vote_average: 8.3 });
    expect(screen.getByText('8.3')).toBeInTheDocument();
  });

  it('shows No Poster when poster_path is null', () => {
    renderWithRouter(minimalMovie);
    expect(screen.getByText('No Poster')).toBeInTheDocument();
  });

  it('renders poster image when poster_path is set', () => {
    const movieWithPoster = { ...minimalMovie, poster_path: '/poster.jpg' };
    renderWithRouter(movieWithPoster);
    const img = screen.getByRole('img', { name: 'Test Movie' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', expect.stringContaining('/poster.jpg'));
  });

  it('wraps content in Link to /movie/:id when showLink is true', () => {
    renderWithRouter(minimalMovie, true);
    const link = screen.getByRole('link', { name: /test movie/i });
    expect(link).toHaveAttribute('href', '/movie/42');
  });

  it('does not render a link when showLink is false', () => {
    renderWithRouter(minimalMovie, false);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
  });

  it('renders genres when provided', () => {
    renderWithRouter({
      ...minimalMovie,
      genres: [
        { id: 1, name: 'Drama' },
        { id: 2, name: 'Thriller' },
      ],
    });
    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText('Thriller')).toBeInTheDocument();
  });

  it('shows runtime when provided', () => {
    renderWithRouter({ ...minimalMovie, runtime: 120 });
    expect(screen.getByText('120 min')).toBeInTheDocument();
  });
});
