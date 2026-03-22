import { useState, useCallback, useEffect } from 'react';
import { localDateString } from '../lib/dateUtils';
import type { Actor, ChainState, Movie, MovieSource } from '../types/movie';
import { recordCastAppearancesForMovie } from '../gamification/castAppearances';
import { scoreChainStep } from '../gamification/chainScoring';
import {
  adjustDailyForLoggedDateChange,
  afterAddMovie,
  afterFirstNote,
  decrementDailyMovies,
  finalizeChainReset,
  recordStartMovie,
  utcDateString,
} from '../gamification/profile';
import { loadGamificationProfile, saveGamificationProfile } from '../gamification/storage';
import type { GamificationProfile } from '../gamification/types';

const STORAGE_KEY = 'movie-chain-state';
const PENDING_ACTOR_KEY = 'pending-actor-pick';

export interface StartChainOptions {
  dailyChallenge?: boolean;
  /** Local YYYY-MM-DD — heatmap day for the first movie (default: today). */
  loggedDate?: string;
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
        prependMode: parsed.prependMode ?? false,
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
    prependMode: false,
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

  const aggregateCastAppearancesForMovie = useCallback((movieId: number, cast: Actor[]) => {
    setGamificationProfile((p) => {
      const next = recordCastAppearancesForMovie(p, movieId, cast);
      if (next === p) return p;
      saveGamificationProfile(next);
      return next;
    });
  }, []);

  const startChain = useCallback((movie: Movie, source?: MovieSource, options?: StartChainOptions) => {
    const logged = options?.loggedDate ?? localDateString();
    setState({
      source: source ?? 'tmdb',
      links: [
        {
          movie,
          connectingActorId: null,
          connectingActorName: null,
          comment: '',
          loggedDate: logged,
        },
      ],
      currentStep: 'pick-actor',
      selectedActorId: null,
      excludedActorId: null,
      prependMode: false,
      dailyChallengeDate: options?.dailyChallenge ? utcDateString() : null,
    });
    queueMicrotask(() => {
      setGamificationProfile((p) => {
        const next = recordStartMovie(p, logged);
        saveGamificationProfile(next);
        return next;
      });
    });
  }, []);

  const startPrependToChain = useCallback(() => {
    setState((prev) => {
      if (prev.links.length === 0) return prev;
      return {
        ...prev,
        prependMode: true,
        currentStep: 'pick-actor',
        selectedActorId: null,
        excludedActorId: null,
      };
    });
    sessionStorage.removeItem(PENDING_ACTOR_KEY);
  }, []);

  const cancelPrepend = useCallback(() => {
    sessionStorage.removeItem(PENDING_ACTOR_KEY);
    setState((prev) => ({
      ...prev,
      prependMode: false,
      currentStep: 'pick-actor',
      selectedActorId: null,
    }));
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

  const addMovie = useCallback((movie: Movie, loggedDate?: string) => {
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
      const day = loggedDate ?? localDateString();
      const prependMode = prev.prependMode === true && prev.links.length > 0;

      let newLinks: typeof prev.links;
      let newLinkIndex: number;

      if (prependMode) {
        const first = prev.links[0];
        const stepDifficulty = scoreChainStep(first.movie, actorPopularity);
        newLinks = [
          {
            movie,
            connectingActorId: null,
            connectingActorName: null,
            comment: '',
            loggedDate: day,
          },
          {
            ...first,
            connectingActorId: prev.selectedActorId,
            connectingActorName: actorName,
            stepDifficulty,
          },
          ...prev.links.slice(1),
        ];
        newLinkIndex = 0;
      } else {
        const stepDifficulty = scoreChainStep(movie, actorPopularity);
        newLinks = [
          ...prev.links,
          {
            movie,
            connectingActorId: prev.selectedActorId,
            connectingActorName: actorName,
            comment: '',
            loggedDate: day,
            stepDifficulty,
          },
        ];
        newLinkIndex = newLinks.length - 1;
      }

      const tail = newLinks[newLinks.length - 1];

      queueMicrotask(() => {
        setGamificationProfile((p) => {
          const r = afterAddMovie(p, newLinks, newLinkIndex);
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
        prependMode: false,
        currentStep: 'pick-actor',
        excludedActorId: tail.connectingActorId ?? null,
        selectedActorId: null,
      };
    });
  }, []);

  const updateLoggedDate = useCallback((index: number, loggedDate: string) => {
    setState((prev) => {
      const link = prev.links[index];
      if (!link) return prev;
      const oldDate = link.loggedDate;
      if (oldDate === loggedDate) return prev;
      const links = [...prev.links];
      links[index] = { ...link, loggedDate };
      queueMicrotask(() => {
        setGamificationProfile((p) => {
          const next = adjustDailyForLoggedDateChange(p, oldDate, loggedDate);
          saveGamificationProfile(next);
          return next;
        });
      });
      return { ...prev, links };
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
          let next = finalizeChainReset(p, linksSnapshot, dailySnapshot);
          for (const link of linksSnapshot) {
            if (link.loggedDate) {
              next = decrementDailyMovies(next, link.loggedDate);
            }
          }
          saveGamificationProfile(next);
          return next;
        });
      });
      return {
        links: [],
        currentStep: 'start',
        selectedActorId: null,
        excludedActorId: null,
        prependMode: false,
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
        const only = prev.links[0];
        const onlyDay = only?.loggedDate;
        queueMicrotask(() => {
          if (onlyDay) {
            setGamificationProfile((p) => {
              const next = decrementDailyMovies(p, onlyDay);
              saveGamificationProfile(next);
              return next;
            });
          }
        });
        return {
          links: [],
          currentStep: 'start',
          selectedActorId: null,
          excludedActorId: null,
          prependMode: false,
          dailyChallengeDate: null,
        };
      }
      const removed = prev.links[prev.links.length - 1];
      const removedDay = removed.loggedDate;
      queueMicrotask(() => {
        if (removedDay) {
          setGamificationProfile((p) => {
            const next = decrementDailyMovies(p, removedDay);
            saveGamificationProfile(next);
            return next;
          });
        }
      });
      const links = prev.links.slice(0, -1);
      const prevLink = links.length >= 2 ? links[links.length - 1] : null;
      return {
        ...prev,
        links,
        prependMode: false,
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
    aggregateCastAppearancesForMovie,
    startChain,
    startPrependToChain,
    cancelPrepend,
    selectActor,
    addMovie,
    updateComment,
    updateLoggedDate,
    resetChain,
    undoLast,
    cancelActorSelection,
  };
}
