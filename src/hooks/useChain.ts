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
import {
  BACKUP_PENDING_ACTOR_KEY,
  buildExportJsonFile,
  downloadTextFile,
  backupFilenameForListJson,
  backupFilenameForListCsv,
  parseChainListsBackupJson,
  persistedSnapshotForSingleList,
  prepareImportedListsMerge,
  prepareImportedListsReplace,
} from '../utils/chainListsBackup';
import { buildChainListsCsv } from '../utils/chainListsCsv';
import { recordCastAppearancesForMovie, rebuildActorCastAppearanceCounts } from '../gamification/castAppearances';
import { crossListUsage, type CrossListUsage } from '../utils/chainLinks';
import { scoreChainStep } from '../gamification/chainScoring';
import {
  acknowledgeMoviesMilestoneModal,
  adjustDailyForLoggedDateChange,
  afterAddMovie,
  afterFirstNote,
  decrementDailyMoviesByStrike,
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

if (PENDING_ACTOR_KEY !== BACKUP_PENDING_ACTOR_KEY) {
  throw new Error('PENDING_ACTOR_KEY must match BACKUP_PENDING_ACTOR_KEY in chainListsBackup.ts');
}

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
        const d = link.loggedDate?.trim();
        if (d) {
          next = decrementDailyMoviesByStrike(next, link.heatmapStrikeId ?? 0, d);
        }
      }
      if (linksSnapshot.length > 0) {
        next = { ...next, heatmapNextRunId: next.heatmapNextRunId + 1 };
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
    setPersisted((prev) => {
      const maxRun = prev.lists.reduce((m, e) => Math.max(m, e.heatmapListRunId ?? -1), -1);
      const newEntry: ChainListEntry = {
        id: crypto.randomUUID(),
        name: trimmed,
        state: createEmptyChainState(),
        heatmapListRunId: maxRun + 1,
      };
      return {
        version: 1,
        activeListId: newEntry.id,
        lists: [...prev.lists, newEntry],
      };
    });
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
          const maxRun = prev.lists.reduce((m, e) => Math.max(m, e.heatmapListRunId ?? -1), -1);
          const fresh: ChainListEntry = {
            id: crypto.randomUUID(),
            name: DEFAULT_MIGRATED_LIST_NAME,
            state: createEmptyChainState(),
            heatmapListRunId: maxRun + 1,
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

  const startChain = useCallback(
    (movie: Movie, source?: MovieSource, options?: StartChainOptions) => {
      const logged = normalizeLoggedDateForHeatmap(options?.loggedDate);
      const listRun = activeEntry?.heatmapListRunId ?? 0;
      const strikeForRun = Math.max(gamificationProfile.heatmapNextRunId, listRun);
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
            heatmapStrikeId: strikeForRun,
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
          const next = recordStartMovie(p, logged, strikeForRun);
          saveGamificationProfile(next);
          return next;
        });
      });
    },
    [activeEntry?.heatmapListRunId, gamificationProfile.heatmapNextRunId, updateActiveState]
  );

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
      const strikeForNew = prev.links[0]?.heatmapStrikeId ?? 0;

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
            heatmapStrikeId: strikeForNew,
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
            heatmapStrikeId: strikeForNew,
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
          const next = adjustDailyForLoggedDateChange(
            p,
            oldDate,
            loggedDate,
            link.heatmapStrikeId ?? 0
          );
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

  const crossListData: CrossListUsage = useMemo(
    () => crossListUsage(lists, activeListId),
    [lists, activeListId]
  );

  const getListLinks = useCallback(
    (id: string) => persisted.lists.find((e) => e.id === id)?.state.links ?? [],
    [persisted.lists]
  );

  const exportActiveListJson = useCallback(() => {
    const entry = persisted.lists.find((e) => e.id === activeListId);
    if (!entry) return;
    const single = persistedSnapshotForSingleList(entry);
    const json = buildExportJsonFile(single);
    downloadTextFile(backupFilenameForListJson(entry.name), json, 'application/json;charset=utf-8');
  }, [persisted, activeListId]);

  const exportActiveListCsv = useCallback(() => {
    const entry = persisted.lists.find((e) => e.id === activeListId);
    if (!entry) return;
    const single = persistedSnapshotForSingleList(entry);
    const csv = buildChainListsCsv(single);
    downloadTextFile(backupFilenameForListCsv(entry.name), csv, 'text/csv;charset=utf-8');
  }, [persisted, activeListId]);

  const importChainListsFromJson = useCallback((text: string, mode: 'replace' | 'merge') => {
    const data = parseChainListsBackupJson(text);
    try {
      sessionStorage.removeItem(PENDING_ACTOR_KEY);
    } catch {
      // ignore
    }
    if (mode === 'replace') {
      setPersisted(prepareImportedListsReplace(data, PENDING_ACTOR_KEY));
    } else {
      setPersisted((prev) => prepareImportedListsMerge(prev, data, PENDING_ACTOR_KEY));
    }
  }, []);

  return {
    ...state,
    activeListId,
    activeListName,
    chainLists,
    crossListData,
    getListLinks,
    exportActiveListJson,
    exportActiveListCsv,
    importChainListsFromJson,
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
