import { describe, it, expect } from 'vitest';
import { scoreChainStep } from './chainScoring';
import type { Movie } from '../types/movie';

const baseMovie: Movie = {
  id: 1,
  title: 'Test',
  overview: '',
  poster_path: null,
  backdrop_path: null,
  release_date: '2020-01-01',
  vote_average: 7,
  vote_count: 10_000,
  popularity: 50,
};

describe('scoreChainStep', () => {
  it('returns higher score for obscure movie and actor', () => {
    const obscure: Movie = {
      ...baseMovie,
      vote_count: 50,
      popularity: 5,
    };
    const high = scoreChainStep(obscure, 2);
    const low = scoreChainStep(baseMovie, 80);
    expect(high).toBeGreaterThan(low);
  });

  it('treats null actor popularity as no actor bonus', () => {
    const m = { ...baseMovie, vote_count: 5000 };
    const s = scoreChainStep(m, null);
    expect(s).toBeGreaterThanOrEqual(0);
  });
});
