import { describe, it, expect } from 'vitest';
import {
  scoreActorContribution,
  scoreChainStep,
  scoreMovieContribution,
} from './chainScoring';
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

  it('equals movie contribution plus actor contribution', () => {
    const m = { ...baseMovie, vote_count: 100, popularity: 5 };
    const ap = 8;
    expect(scoreChainStep(m, ap)).toBe(
      scoreMovieContribution(m) + scoreActorContribution(ap)
    );
  });
});

describe('scoreActorContribution', () => {
  it('returns 0 for null', () => {
    expect(scoreActorContribution(null)).toBe(0);
  });
});

describe('scoreMovieContribution', () => {
  it('ignores actor', () => {
    expect(scoreMovieContribution(baseMovie)).toBeGreaterThanOrEqual(0);
  });
});
