import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChain } from './useChain';
import type { Movie } from '../types/movie';

const STORAGE_KEY = 'movie-chain-state';
const PENDING_ACTOR_KEY = 'pending-actor-pick';
function createMockStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(store)) delete store[key];
    }),
    get store() {
      return { ...store };
    },
  };
}

/** Flushes queueMicrotask callbacks from gamification updates */
async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
  });
}

const minimalMovie: Movie = {
  id: 1,
  title: 'Test Movie',
  overview: 'Overview',
  poster_path: null,
  backdrop_path: null,
  release_date: '2020-01-01',
  vote_average: 7,
  vote_count: 100,
  popularity: 10,
};

describe('useChain', () => {
  let localStorageMock: ReturnType<typeof createMockStorage>;
  let sessionStorageMock: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    localStorageMock = createMockStorage();
    sessionStorageMock = createMockStorage();
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('sessionStorage', sessionStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns initial state with no links and currentStep start', () => {
    const { result } = renderHook(() => useChain());
    expect(result.current.links).toEqual([]);
    expect(result.current.currentStep).toBe('start');
    expect(result.current.selectedActorId).toBeNull();
    expect(result.current.selectedActorName).toBeNull();
  });

  it('startChain sets one link and step to pick-actor', async () => {
    const { result } = renderHook(() => useChain());
    act(() => {
      result.current.startChain(minimalMovie);
    });
    await flushMicrotasks();
    expect(result.current.links).toHaveLength(1);
    expect(result.current.links[0].movie).toEqual(minimalMovie);
    expect(result.current.links[0].connectingActorId).toBeNull();
    expect(result.current.links[0].connectingActorName).toBeNull();
    expect(result.current.links[0].comment).toBe('');
    expect(result.current.currentStep).toBe('pick-actor');
  });

  it('persists state to localStorage after startChain', async () => {
    const { result } = renderHook(() => useChain());
    act(() => {
      result.current.startChain(minimalMovie);
    });
    await flushMicrotasks();
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.stringContaining('"currentStep":"pick-actor"')
    );
  });

  it('selectActor updates step to pick-movie and selectedActorId', async () => {
    const { result } = renderHook(() => useChain());
    act(() => result.current.startChain(minimalMovie));
    await flushMicrotasks();
    act(() => result.current.selectActor(42, 'Jane Doe'));
    expect(result.current.currentStep).toBe('pick-movie');
    expect(result.current.selectedActorId).toBe(42);
    expect(result.current.selectedActorName).toBe('Jane Doe');
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      PENDING_ACTOR_KEY,
      JSON.stringify({ name: 'Jane Doe', popularity: null })
    );
  });

  it('addMovie appends second link with connecting actor', async () => {
    const movie2: Movie = { ...minimalMovie, id: 2, title: 'Second' };
    const { result } = renderHook(() => useChain());
    act(() => result.current.startChain(minimalMovie));
    await flushMicrotasks();
    act(() => result.current.selectActor(42, 'Jane Doe'));
    act(() => result.current.addMovie(movie2));
    await flushMicrotasks();
    expect(result.current.links).toHaveLength(2);
    expect(result.current.links[1].movie).toEqual(movie2);
    expect(result.current.links[1].connectingActorId).toBe(42);
    expect(result.current.links[1].connectingActorName).toBe('Jane Doe');
    expect(result.current.links[1].stepDifficulty).toBeDefined();
    expect(result.current.currentStep).toBe('pick-actor');
    expect(result.current.selectedActorId).toBeNull();
    expect(result.current.selectedActorName).toBeNull();
  });

  it('addMovie uses selectedActorName when pending session storage was cleared', async () => {
    const movie2: Movie = { ...minimalMovie, id: 2, title: 'Second' };
    const { result } = renderHook(() => useChain());
    act(() => result.current.startChain(minimalMovie));
    await flushMicrotasks();
    act(() => result.current.selectActor(42, 'Jane Doe'));
    act(() => sessionStorageMock.removeItem(PENDING_ACTOR_KEY));
    act(() => result.current.addMovie(movie2));
    await flushMicrotasks();
    expect(result.current.links[1].connectingActorName).toBe('Jane Doe');
  });

  it('updateComment updates comment at index', async () => {
    const { result } = renderHook(() => useChain());
    act(() => result.current.startChain(minimalMovie));
    await flushMicrotasks();
    act(() => result.current.updateComment(0, 'My comment'));
    await flushMicrotasks();
    expect(result.current.links[0].comment).toBe('My comment');
  });

  it('resetChain clears links and returns to start', async () => {
    const { result } = renderHook(() => useChain());
    act(() => result.current.startChain(minimalMovie));
    await flushMicrotasks();
    act(() => result.current.resetChain());
    await flushMicrotasks();
    expect(result.current.links).toEqual([]);
    expect(result.current.currentStep).toBe('start');
    expect(result.current.selectedActorId).toBeNull();
  });

  it('cancelActorSelection clears selectedActorId and step to pick-actor', async () => {
    const { result } = renderHook(() => useChain());
    act(() => result.current.startChain(minimalMovie));
    await flushMicrotasks();
    act(() => result.current.selectActor(1, 'Actor'));
    act(() => result.current.cancelActorSelection());
    expect(result.current.selectedActorId).toBeNull();
    expect(result.current.selectedActorName).toBeNull();
    expect(result.current.currentStep).toBe('pick-actor');
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith(PENDING_ACTOR_KEY);
  });

  it('undoLast with one link clears chain', async () => {
    const { result } = renderHook(() => useChain());
    act(() => result.current.startChain(minimalMovie));
    await flushMicrotasks();
    act(() => result.current.undoLast());
    await flushMicrotasks();
    expect(result.current.links).toEqual([]);
    expect(result.current.currentStep).toBe('start');
  });

  it('startPrependToChain then addMovie prepends link and sets connector on former first', async () => {
    const movie0: Movie = { ...minimalMovie, id: 3, title: 'Older' };
    const { result } = renderHook(() => useChain());
    act(() => result.current.startChain(minimalMovie));
    await flushMicrotasks();
    act(() => result.current.startPrependToChain());
    expect(result.current.prependMode).toBe(true);
    act(() => result.current.selectActor(99, 'Bridge Actor'));
    act(() => result.current.addMovie(movie0));
    await flushMicrotasks();
    expect(result.current.prependMode).toBe(false);
    expect(result.current.links).toHaveLength(2);
    expect(result.current.links[0].movie).toEqual(movie0);
    expect(result.current.links[0].connectingActorId).toBeNull();
    expect(result.current.links[1].movie).toEqual(minimalMovie);
    expect(result.current.links[1].connectingActorId).toBe(99);
    expect(result.current.links[1].connectingActorName).toBe('Bridge Actor');
    expect(result.current.currentStep).toBe('pick-actor');
  });

  it('undoLast with two links removes last link', async () => {
    const movie2: Movie = { ...minimalMovie, id: 2, title: 'Second' };
    const { result } = renderHook(() => useChain());
    act(() => result.current.startChain(minimalMovie));
    await flushMicrotasks();
    act(() => result.current.selectActor(1, 'A'));
    act(() => result.current.addMovie(movie2));
    await flushMicrotasks();
    expect(result.current.links).toHaveLength(2);
    act(() => result.current.undoLast());
    await flushMicrotasks();
    expect(result.current.links).toHaveLength(1);
    expect(result.current.links[0].movie.id).toBe(1);
    expect(result.current.currentStep).toBe('pick-actor');
  });

  it('removeFirst with two links drops oldest and clears bridge on new head', async () => {
    const movie2: Movie = { ...minimalMovie, id: 2, title: 'Second' };
    const { result } = renderHook(() => useChain());
    act(() => result.current.startChain(minimalMovie));
    await flushMicrotasks();
    act(() => result.current.selectActor(1, 'A'));
    act(() => result.current.addMovie(movie2));
    await flushMicrotasks();
    expect(result.current.links[0].entryKind).toBe('start');
    expect(result.current.links[1].connectingActorId).toBe(1);
    act(() => result.current.removeFirst());
    await flushMicrotasks();
    expect(result.current.links).toHaveLength(1);
    expect(result.current.links[0].movie.id).toBe(2);
    expect(result.current.links[0].connectingActorId).toBeNull();
    expect(result.current.links[0].connectingActorName).toBeNull();
    expect(result.current.links[0].stepDifficulty).toBeUndefined();
  });

  it('removeFirst with one link clears chain like undoLast', async () => {
    const { result } = renderHook(() => useChain());
    act(() => result.current.startChain(minimalMovie));
    await flushMicrotasks();
    act(() => result.current.removeFirst());
    await flushMicrotasks();
    expect(result.current.links).toEqual([]);
    expect(result.current.currentStep).toBe('start');
  });

  it('startChain sets entryKind start and append link sets entryKind append', async () => {
    const movie2: Movie = { ...minimalMovie, id: 2, title: 'Second' };
    const { result } = renderHook(() => useChain());
    act(() => result.current.startChain(minimalMovie));
    await flushMicrotasks();
    expect(result.current.links[0].entryKind).toBe('start');
    act(() => result.current.selectActor(1, 'A'));
    act(() => result.current.addMovie(movie2));
    await flushMicrotasks();
    expect(result.current.links[1].entryKind).toBe('append');
  });

  it('addMovie does nothing when movie id is already in the chain', async () => {
    const { result } = renderHook(() => useChain());
    act(() => result.current.startChain(minimalMovie));
    await flushMicrotasks();
    act(() => result.current.selectActor(42, 'Jane Doe'));
    act(() => result.current.addMovie(minimalMovie));
    await flushMicrotasks();
    expect(result.current.links).toHaveLength(1);
    expect(result.current.currentStep).toBe('pick-movie');
    expect(result.current.selectedActorId).toBe(42);
  });
});
