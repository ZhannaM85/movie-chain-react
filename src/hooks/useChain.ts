import { useState, useCallback, useEffect } from 'react';
import type { ChainState, Movie, MovieSource } from '../types/movie';
import { scoreChainStep } from '../gamification/chainScoring';
import {
  afterAddMovie,
  afterFirstNote,
  applyStreak,
  finalizeChainReset,
  utcDateString,
} from '../gamification/profile';
import { loadGamificationProfile, saveGamificationProfile } from '../gamification/storage';
import type { GamificationProfile } from '../gamification/types';

const STORAGE_KEY = 'movie-chain-state';
const PENDING_ACTOR_KEY = 'pending-actor-pick';

export interface StartChainOptions {
  dailyChallenge?: boolean;
}

/**
 * Loads the persisted movie chain state from localStorage, falling back to the initial state.
 */
function loadState(): ChainState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ChainState) : null;
    if (parsed) {
      return {
        ...parsed,
        source: parsed.source ?? 'tmdb',
        dailyChallengeDate: parsed.dailyChallengeDate ?? null,
      };
    }
  } catch {
    // ignore corrupted data
  }
  return {
    links: [],
    currentStep: 'start',
    selectedActorId: null,
    excludedActorId: null,
    dailyChallengeDate: null,
  };
}

function saveState(state: ChainState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * React hook that manages the full lifecycle of a movie chain,
 * including persistence, navigation steps, user comments, and gamification.
 */
export function useChain() {
  const [state, setState] = useState<ChainState>(loadState);
  const [gamificationProfile, setGamificationProfile] = useState<GamificationProfile>(loadGamificationProfile);
  const [gamificationToastQueue, setGamificationToastQueue] = useState<string[]>([]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const dismissGamificationToast = useCallback(() => {
    setGamificationToastQueue((q) => q.slice(1));
  }, []);

  const startChain = useCallback((movie: Movie, source?: MovieSource, options?: StartChainOptions) => {
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
      dailyChallengeDate: options?.dailyChallenge ? utcDateString() : null,
    });
    queueMicrotask(() => {
      setGamificationProfile((p) => {
        const next = applyStreak(p);
        saveGamificationProfile(next);
        return next;
      });
    });
  }, []);

  const selectActor = useCallback((actorId: number, actorName: string, actorPopularity?: number | null) => {
    setState((prev) => ({
      ...prev,
      currentStep: 'pick-movie',
      selectedActorId: actorId,
    }));
    sessionStorage.setItem(
      PENDING_ACTOR_KEY,
      JSON.stringify({ name: actorName, popularity: actorPopularity ?? null })
    );
  }, []);

  const addMovie = useCallback((movie: Movie) => {
    setState((prev) => {
      const raw = sessionStorage.getItem(PENDING_ACTOR_KEY);
      sessionStorage.removeItem(PENDING_ACTOR_KEY);
      let actorName: string | null = null;
      let actorPopularity: number | null = null;
      if (raw) {
        try {
          const pick = JSON.parse(raw) as { name: string; popularity: number | null };
          actorName = pick.name;
          actorPopularity = pick.popularity;
        } catch {
          actorName = null;
        }
      }
      const stepDifficulty = scoreChainStep(movie, actorPopularity);
      const newLinks = [
        ...prev.links,
        {
          movie,
          connectingActorId: prev.selectedActorId,
          connectingActorName: actorName,
          comment: '',
          stepDifficulty,
        },
      ];
      queueMicrotask(() => {
        setGamificationProfile((p) => {
          const r = afterAddMovie(p, newLinks);
          saveGamificationProfile(r.profile);
          const toasts: string[] = [];
          if (r.newAchievements.length) {
            toasts.push(...r.newAchievements.map((id) => `achievement:${id}`));
          }
          if (r.beatPersonalBest) {
            toasts.push('personal_best');
          }
          if (toasts.length) {
            setGamificationToastQueue((q) => [...q, ...toasts]);
          }
          return r.profile;
        });
      });
      return {
        ...prev,
        source: prev.source ?? 'tmdb',
        links: newLinks,
        currentStep: 'pick-actor',
        excludedActorId: prev.selectedActorId,
        selectedActorId: null,
      };
    });
  }, []);

  const updateComment = useCallback((index: number, comment: string) => {
    setState((prev) => {
      const prevComment = prev.links[index]?.comment ?? '';
      const wasEmpty = !prevComment.trim();
      const willHaveContent = comment.trim().length > 0;
      const links = [...prev.links];
      if (links[index]) {
        links[index] = { ...links[index], comment };
      }
      if (wasEmpty && willHaveContent) {
        queueMicrotask(() => {
          setGamificationProfile((p) => {
            const res = afterFirstNote(p);
            saveGamificationProfile(res.profile);
            if (res.newAchievements.length) {
              setGamificationToastQueue((q) => [
                ...q,
                ...res.newAchievements.map((id) => `achievement:${id}`),
              ]);
            }
            return res.profile;
          });
        });
      }
      return { ...prev, links };
    });
  }, []);

  const resetChain = useCallback(() => {
    setState((prev) => {
      const linksSnapshot = prev.links;
      const dailySnapshot = prev.dailyChallengeDate;
      queueMicrotask(() => {
        setGamificationProfile((p) => {
          const next = finalizeChainReset(p, linksSnapshot, dailySnapshot);
          saveGamificationProfile(next);
          return next;
        });
      });
      return {
        links: [],
        currentStep: 'start',
        selectedActorId: null,
        excludedActorId: null,
        dailyChallengeDate: null,
      };
    });
  }, []);

  const cancelActorSelection = useCallback(() => {
    sessionStorage.removeItem(PENDING_ACTOR_KEY);
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
          dailyChallengeDate: null,
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
    gamificationProfile,
    gamificationToastQueue,
    dismissGamificationToast,
    startChain,
    selectActor,
    addMovie,
    updateComment,
    resetChain,
    undoLast,
    cancelActorSelection,
  };
}
