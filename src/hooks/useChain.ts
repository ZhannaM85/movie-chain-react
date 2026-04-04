import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { normalizeLoggedDateForHeatmap } from '../lib/dateUtils';
import type { Actor, ChainState, Movie, MovieSource } from '../types/movie';
import {
  CHAIN_LIST_NAME_MAX_LENGTH,
  createEmptyChainState,
  loadChainListsPersisted,
  saveChainListsPersisted,
  type ChainListEntry,
  type ChainListsPersisted,
} from '../types/chainLists';
import { recordCastAppearancesForMovie, rebuildActorCastAppearanceCounts } from '../gamification/castAppearances';
import { scoreChainStep } from '../gamification/chainScoring';
import {
  acknowledgeMoviesMilestoneModal,
  adjustDailyForLoggedDateChange,
  afterAddMovie,
  afterFirstNote,
  decrementDailyMovies,
  ensureDailyCountsFromLinks,
  finalizeChainReset,
  getPendingMoviesMilestoneModal,
  recordStartMovie,
  syncProfileStreakFromHeatmapData,
  reverseAfterRemoveFirst,
  reverseAfterRemoveLast,
  utcDateString,
} from '../gamification/profile';
import { loadGamificationProfile, saveGamificationProfile } from '../gamification/storage';
import type { GamificationProfile } from '../gamification/types';

const PENDING_ACTOR_KEY = 'pending-actor-pick';

/** Used when migrating legacy storage before i18n is available. */
const DEFAULT_MIGRATED_LIST_NAME = 'My list';

export interface StartChainOptions {
  dailyChallenge?: boolean;
  /** Local YYYY-MM-DD — heatmap day for the first movie (default: today). */
  loggedDate?: string;
}

function applyGamificationForClearingList(
  setGamificationProfile: Dispatch<SetStateAction<GamificationProfile>>,
  linksSnapshot: ChainState['links'],
  dailySnapshot: string | null | undefined
) {
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
}

/**
 * React hook that manages the full lifecycle of movie chains (named lists),
 * including persistence, navigation steps, user comments, and gamification.
 */
export function useChain() {
  const [persisted, setPersisted] = useState<ChainListsPersisted>(() =>
    loadChainListsPersisted(DEFAULT_MIGRATED_LIST_NAME, PENDING_ACTOR_KEY)
  );
  const [gamificationProfile, setGamificationProfile] = useState<GamificationProfile>(loadGamificationProfile);
  const [gamificationToastQueue, setGamificationToastQueue] = useState<string[]>([]);

  const activeListId = persisted.activeListId;
  const lists = persisted.lists;

  const activeEntry = useMemo(() => {
    const found = lists.find((e) => e.id === activeListId);
    return found ?? lists[0];
  }, [lists, activeListId]);

  const state = activeEntry?.state ?? createEmptyChainState();

  useEffect(() => {
    saveChainListsPersisted(persisted);
  }, [persisted]);

  useEffect(() => {
    setGamificationProfile((p) => {
      let next = ensureDailyCountsFromLinks(p, state.links);
      next = rebuildActorCastAppearanceCounts(next, state.links);
      next = syncProfileStreakFromHeatmapData(next, state.links);
      if (next === p) return p;
      saveGamificationProfile(next);
      return next;
    });
  }, [state.links]);

  const dismissGamificationToast = useCallback(() => {
    setGamificationToastQueue((q) => q.slice(1));
  }, []);

  const pendingMoviesMilestoneModal = useMemo(
    () => getPendingMoviesMilestoneModal(gamificationProfile),
    [gamificationProfile]
  );

  const dismissMoviesMilestoneModal = useCallback(() => {
    setGamificationProfile((p) => {
      const milestone = getPendingMoviesMilestoneModal(p);
      if (milestone == null) return p;
      const next = acknowledgeMoviesMilestoneModal(p, milestone);
      saveGamificationProfile(next);
      return next;
    });
  }, []);

  const aggregateCastAppearancesForMovie = useCallback((movieId: number, cast: Actor[]) => {
    setGamificationProfile((p) => {
      const next = recordCastAppearancesForMovie(p, movieId, cast, state.links);
      if (next === p) return p;
      saveGamificationProfile(next);
      return next;
    });
  }, [state.links]);

  const updateActiveState = useCallback((updater: (prev: ChainState) => ChainState) => {
    setPersisted((prev) => {
      const id = prev.activeListId;
      const nextLists = prev.lists.map((e) =>
        e.id === id ? { ...e, state: updater(e.state) } : e
      );
      return { ...prev, lists: nextLists };
    });
  }, []);

  const setActiveListId = useCallback((id: string) => {
    setPersisted((prev) => {
      if (!prev.lists.some((e) => e.id === id)) return prev;
      try {
        sessionStorage.removeItem(PENDING_ACTOR_KEY);
      } catch {
        // ignore
      }
      return { ...prev, activeListId: id };
    });
  }, []);

  const createList = useCallback((name?: string) => {
    const label = name?.trim() || `List ${persisted.lists.length + 1}`;
    const trimmed = label.slice(0, CHAIN_LIST_NAME_MAX_LENGTH);
    const newEntry: ChainListEntry = {
      id: crypto.randomUUID(),
      name: trimmed,
      state: createEmptyChainState(),
    };
    setPersisted((prev) => ({
      version: 1,
      activeListId: newEntry.id,
      lists: [...prev.lists, newEntry],
    }));
  }, [persisted.lists.length]);

  const renameList = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const nextName = trimmed.slice(0, CHAIN_LIST_NAME_MAX_LENGTH);
    setPersisted((prev) => ({
      ...prev,
      lists: prev.lists.map((e) => (e.id === id ? { ...e, name: nextName } : e)),
    }));
  }, []);

  const deleteList = useCallback(
    (id: string) => {
      setPersisted((prev) => {
        const victim = prev.lists.find((e) => e.id === id);
        if (!victim) return prev;

        if (victim.state.links.length > 0) {
          applyGamificationForClearingList(
            setGamificationProfile,
            victim.state.links,
            victim.state.dailyChallengeDate
          );
        }

        const remaining = prev.lists.filter((e) => e.id !== id);
        if (remaining.length === 0) {
          const fresh: ChainListEntry = {
            id: crypto.randomUUID(),
            name: DEFAULT_MIGRATED_LIST_NAME,
            state: createEmptyChainState(),
          };
          return { version: 1, activeListId: fresh.id, lists: [fresh] };
        }

        let nextActive = prev.activeListId;
        if (prev.activeListId === id) {
          nextActive = remaining[0].id;
        }
        try {
          sessionStorage.removeItem(PENDING_ACTOR_KEY);
        } catch {
          // ignore
        }
        return { version: 1, activeListId: nextActive, lists: remaining };
      });
    },
    []
  );

  const startChain = useCallback((movie: Movie, source?: MovieSource, options?: StartChainOptions) => {
    const logged = normalizeLoggedDateForHeatmap(options?.loggedDate);
    updateActiveState(() => ({
      source: source ?? 'tmdb',
      links: [
        {
          movie,
          connectingActorId: null,
          connectingActorName: null,
          comment: '',
          loggedDate: logged,
          entryKind: 'start',
        },
      ],
      currentStep: 'pick-actor',
      selectedActorId: null,
      selectedActorName: null,
      prependMode: false,
      dailyChallengeDate: options?.dailyChallenge ? utcDateString() : null,
    }));
    queueMicrotask(() => {
      setGamificationProfile((p) => {
        const next = recordStartMovie(p, logged);
        saveGamificationProfile(next);
        return next;
      });
    });
  }, [updateActiveState]);

  const startPrependToChain = useCallback(() => {
    updateActiveState((prev) => {
      if (prev.links.length === 0) return prev;
      return {
        ...prev,
        prependMode: true,
        currentStep: 'pick-actor',
        selectedActorId: null,
        selectedActorName: null,
      };
    });
    sessionStorage.removeItem(PENDING_ACTOR_KEY);
  }, [updateActiveState]);

  const cancelPrepend = useCallback(() => {
    sessionStorage.removeItem(PENDING_ACTOR_KEY);
    updateActiveState((prev) => ({
      ...prev,
      prependMode: false,
      currentStep: 'pick-actor',
      selectedActorId: null,
      selectedActorName: null,
    }));
  }, [updateActiveState]);

  const selectActor = useCallback((actorId: number, actorName: string, actorPopularity?: number | null) => {
    updateActiveState((prev) => ({
      ...prev,
      currentStep: 'pick-movie',
      selectedActorId: actorId,
      selectedActorName: actorName,
    }));
    sessionStorage.setItem(
      PENDING_ACTOR_KEY,
      JSON.stringify({ name: actorName, popularity: actorPopularity ?? null })
    );
  }, [updateActiveState]);

  const addMovie = useCallback((movie: Movie, loggedDate?: string) => {
    updateActiveState((prev) => {
      if (prev.links.some((l) => l.movie.id === movie.id)) {
        return prev;
      }
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
      if (actorName == null && prev.selectedActorName != null) {
        actorName = prev.selectedActorName;
      }
      const day = normalizeLoggedDateForHeatmap(loggedDate);
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
            entryKind: 'prepend',
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
            entryKind: 'append',
          },
        ];
        newLinkIndex = newLinks.length - 1;
      }

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
        selectedActorId: null,
        selectedActorName: null,
      };
    });
  }, [updateActiveState]);

  const updateLoggedDate = useCallback((index: number, loggedDate: string) => {
    updateActiveState((prev) => {
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
  }, [updateActiveState]);

  const updateComment = useCallback((index: number, comment: string) => {
    updateActiveState((prev) => {
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
  }, [updateActiveState]);

  const resetChain = useCallback(() => {
    updateActiveState((prev) => {
      applyGamificationForClearingList(setGamificationProfile, prev.links, prev.dailyChallengeDate);
      return {
        links: [],
        currentStep: 'start',
        selectedActorId: null,
        selectedActorName: null,
        prependMode: false,
        dailyChallengeDate: null,
      };
    });
  }, [updateActiveState]);

  const cancelActorSelection = useCallback(() => {
    sessionStorage.removeItem(PENDING_ACTOR_KEY);
    updateActiveState((prev) => ({
      ...prev,
      currentStep: 'pick-actor',
      selectedActorId: null,
      selectedActorName: null,
    }));
  }, [updateActiveState]);

  const undoLast = useCallback(() => {
    updateActiveState((prev) => {
      if (prev.links.length === 0) return prev;
      const linksBefore = prev.links;
      if (prev.links.length <= 1) {
        queueMicrotask(() => {
          setGamificationProfile((p) => {
            const next = reverseAfterRemoveFirst(p, linksBefore);
            saveGamificationProfile(next);
            return next;
          });
        });
        return {
          links: [],
          currentStep: 'start',
          selectedActorId: null,
          selectedActorName: null,
          prependMode: false,
          dailyChallengeDate: null,
        };
      }
      queueMicrotask(() => {
        setGamificationProfile((p) => {
          const next = reverseAfterRemoveLast(p, linksBefore);
          saveGamificationProfile(next);
          return next;
        });
      });
      const links = prev.links.slice(0, -1);
      return {
        ...prev,
        links,
        prependMode: false,
        currentStep: 'pick-actor',
        selectedActorId: null,
        selectedActorName: null,
      };
    });
  }, [updateActiveState]);

  const removeFirst = useCallback(() => {
    updateActiveState((prev) => {
      if (prev.links.length === 0) return prev;
      const linksBefore = prev.links;
      if (prev.links.length === 1) {
        queueMicrotask(() => {
          setGamificationProfile((p) => {
            const next = reverseAfterRemoveFirst(p, linksBefore);
            saveGamificationProfile(next);
            return next;
          });
        });
        return {
          ...prev,
          links: [],
          currentStep: 'start',
          selectedActorId: null,
          selectedActorName: null,
          prependMode: false,
          dailyChallengeDate: null,
        };
      }
      queueMicrotask(() => {
        setGamificationProfile((p) => {
          const next = reverseAfterRemoveFirst(p, linksBefore);
          saveGamificationProfile(next);
          return next;
        });
      });
      const [, ...rest] = prev.links;
      const formerSecond = rest[0];
      const normalizedFirst: typeof formerSecond = {
        ...formerSecond,
        connectingActorId: null,
        connectingActorName: null,
      };
      delete normalizedFirst.stepDifficulty;
      const links = [normalizedFirst, ...rest.slice(1)];
      return {
        ...prev,
        links,
        prependMode: false,
        currentStep: 'pick-actor',
        selectedActorId: null,
        selectedActorName: null,
      };
    });
  }, [updateActiveState]);

  const chainLists = useMemo(
    () => lists.map((e) => ({ id: e.id, name: e.name, linkCount: e.state.links.length })),
    [lists]
  );
  const activeListName = activeEntry?.name ?? '';

  const getListLinks = useCallback(
    (id: string) => persisted.lists.find((e) => e.id === id)?.state.links ?? [],
    [persisted.lists]
  );

  return {
    ...state,
    activeListId,
    activeListName,
    chainLists,
    getListLinks,
    setActiveListId,
    createList,
    renameList,
    deleteList,
    gamificationProfile,
    gamificationToastQueue,
    dismissGamificationToast,
    pendingMoviesMilestoneModal,
    dismissMoviesMilestoneModal,
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
    removeFirst,
    cancelActorSelection,
  };
}
