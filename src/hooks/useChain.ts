import { useState, useCallback, useEffect } from 'react';
import type { ChainState, Movie } from '../types/movie';

const STORAGE_KEY = 'movie-chain-state';

function loadState(): ChainState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ChainState;
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

function saveState(state: ChainState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useChain() {
  const [state, setState] = useState<ChainState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const startChain = useCallback((movie: Movie) => {
    setState({
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
  };
}
