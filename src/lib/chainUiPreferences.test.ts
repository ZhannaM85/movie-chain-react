import { describe, it, expect } from 'vitest';
import { normalizeChainUiPickModes, DEFAULT_CHAIN_UI_PREFERENCES } from './chainUiPreferences';

describe('normalizeChainUiPickModes', () => {
  it('clears strict actors when random actors is on', () => {
    const out = normalizeChainUiPickModes({
      ...DEFAULT_CHAIN_UI_PREFERENCES,
      strictListOrderActors: true,
      randomSinglePickActors: true,
    });
    expect(out.strictListOrderActors).toBe(false);
    expect(out.randomSinglePickActors).toBe(true);
  });

  it('clears strict movies when random movies is on', () => {
    const out = normalizeChainUiPickModes({
      ...DEFAULT_CHAIN_UI_PREFERENCES,
      strictListOrderMovies: true,
      randomSinglePickMovies: true,
    });
    expect(out.strictListOrderMovies).toBe(false);
    expect(out.randomSinglePickMovies).toBe(true);
  });

  it('does not mix axes', () => {
    const out = normalizeChainUiPickModes({
      ...DEFAULT_CHAIN_UI_PREFERENCES,
      strictListOrderActors: true,
      randomSinglePickMovies: true,
    });
    expect(out.strictListOrderActors).toBe(true);
    expect(out.strictListOrderMovies).toBe(false);
  });
});
