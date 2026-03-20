import { useState, useCallback, useEffect } from 'react';
import type { ChainState, Movie, MovieSource } from '../types/movie';

const STORAGE_KEY = 'movie-chain-state';

/**
 * Loads the persisted movie chain state from localStorage, falling back to the initial state.
 *
 * @returns {ChainState} The restored or default chain state.
 */
function loadState(): ChainState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ChainState) : null;
    if (parsed) {
      return { ...parsed, source: parsed.source ?? 'tmdb' };
    }
  } catch {
    // ignore corrupted data
  }
  return {
    links: [],
    currentStep: 'start',
    selectedActorId: null,
    excludedActorId: null,
  };
}

/**
 * Persists the given chain state to localStorage.
 *
 * @param {ChainState} state - The current chain state to store.
 */
function saveState(state: ChainState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * React hook that manages the full lifecycle of a movie chain,
 * including persistence, navigation steps, and user comments.
 *
 * @returns {ChainState & {
 *   startChain: (movie: Movie) => void;
 *   selectActor: (actorId: number, actorName: string) => void;
 *   addMovie: (movie: Movie) => void;
 *   updateComment: (index: number, comment: string) => void;
 *   resetChain: () => void;
 *   undoLast: () => void;
 *   cancelActorSelection: () => void;
 * }} The current chain state and mutation helpers.
 */
export function useChain() {
  const [state, setState] = useState<ChainState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const startChain = useCallback((movie: Movie, source?: MovieSource) => {
    setState({
      source: source ?? 'tmdb',
      links: [
        {
          movie,
          connectingActorId: null,
          connectingActorName: null,
          comment: '',
        },
      ],
      currentStep: 'pick-actor',
      selectedActorId: null,
      excludedActorId: null,
    });
  }, []);

  const selectActor = useCallback((actorId: number, actorName: string) => {
    setState((prev) => ({
      ...prev,
      currentStep: 'pick-movie',
      selectedActorId: actorId,
    }));
    // Store the actor name temporarily — it will be saved on the next link
    sessionStorage.setItem('pending-actor-name', actorName);
  }, []);

  const addMovie = useCallback((movie: Movie) => {
    setState((prev) => {
      const actorName = sessionStorage.getItem('pending-actor-name') || null;
      sessionStorage.removeItem('pending-actor-name');
      return {
        ...prev,
        source: prev.source ?? 'tmdb',
        links: [
          ...prev.links,
          {
            movie,
            connectingActorId: prev.selectedActorId,
            connectingActorName: actorName,
            comment: '',
          },
        ],
        currentStep: 'pick-actor',
        excludedActorId: prev.selectedActorId,
        selectedActorId: null,
      };
    });
  }, []);

  const updateComment = useCallback((index: number, comment: string) => {
    setState((prev) => {
      const links = [...prev.links];
      if (links[index]) {
        links[index] = { ...links[index], comment };
      }
      return { ...prev, links };
    });
  }, []);

  const resetChain = useCallback(() => {
    setState({
      links: [],
      currentStep: 'start',
      selectedActorId: null,
      excludedActorId: null,
    });
  }, []);

  const cancelActorSelection = useCallback(() => {
    sessionStorage.removeItem('pending-actor-name');
    setState((prev) => ({
      ...prev,
      currentStep: 'pick-actor',
      selectedActorId: null,
    }));
  }, []);

  const undoLast = useCallback(() => {
    setState((prev) => {
      if (prev.links.length <= 1) {
        return {
          links: [],
          currentStep: 'start',
          selectedActorId: null,
          excludedActorId: null,
        };
      }
      const links = prev.links.slice(0, -1);
      const prevLink = links.length >= 2 ? links[links.length - 1] : null;
      return {
        ...prev,
        links,
        currentStep: 'pick-actor',
        selectedActorId: null,
        excludedActorId: prevLink?.connectingActorId ?? null,
      };
    });
  }, []);

  return {
    ...state,
    startChain,
    selectActor,
    addMovie,
    updateComment,
    resetChain,
    undoLast,
    cancelActorSelection,
  };
}
