import type { ChainState } from './movie';

/** Persisted multi-list container (localStorage `movie-chain-lists-v1`). */
export const CHAIN_LISTS_STORAGE_KEY = 'movie-chain-lists-v1';

/** Legacy single-chain key — migrated once then removed. */
export const LEGACY_CHAIN_STORAGE_KEY = 'movie-chain-state';

export const CHAIN_LIST_NAME_MAX_LENGTH = 80;

export interface ChainListEntry {
  id: string;
  name: string;
  state: ChainState;
  /** Distinct heatmap run id for this list (older saves omit — assigned on load). */
  heatmapListRunId?: number;
}

export interface ChainListsPersisted {
  version: 1;
  activeListId: string;
  lists: ChainListEntry[];
}

export function createEmptyChainState(): ChainState {
  return {
    links: [],
    currentStep: 'start',
    selectedActorId: null,
    selectedActorName: null,
    prependMode: false,
    dailyChallengeDate: null,
  };
}

/**
 * Normalizes a parsed chain state (legacy or nested), including prependMode fix.
 * `pendingActorKey` is only used when stripping stale prepend — pass the same key as useChain.
 */
export function normalizeChainState(
  parsed: ChainState | null,
  pendingActorKey: string
): ChainState {
  if (!parsed) {
    return createEmptyChainState();
  }
  const hadPersistedPrepend = parsed.prependMode === true;

  if (hadPersistedPrepend) {
    try {
      sessionStorage.removeItem(pendingActorKey);
    } catch {
      // ignore
    }
  }

  return {
    ...parsed,
    source: parsed.source ?? 'tmdb',
    dailyChallengeDate: parsed.dailyChallengeDate ?? null,
    selectedActorName: parsed.selectedActorName ?? null,
    prependMode: false,
    ...(hadPersistedPrepend
      ? {
          currentStep: 'pick-actor' as const,
          selectedActorId: null,
          selectedActorName: null,
        }
      : {}),
  };
}

function newListEntry(
  name: string,
  state: ChainState,
  fallbackName: string,
  heatmapListRunId?: number
): ChainListEntry {
  const n = (name.trim() || fallbackName).slice(0, CHAIN_LIST_NAME_MAX_LENGTH);
  return {
    id: crypto.randomUUID(),
    name: n,
    state,
    ...(typeof heatmapListRunId === 'number' && Number.isFinite(heatmapListRunId) && heatmapListRunId >= 0
      ? { heatmapListRunId }
      : {}),
  };
}

/** Ensures every list has a heatmapListRunId and returns max id. */
export function assignHeatmapListRunIds(lists: ChainListEntry[]): {
  lists: ChainListEntry[];
  changed: boolean;
} {
  let maxId = lists.reduce((m, e) => {
    const r = e.heatmapListRunId;
    return typeof r === 'number' && Number.isFinite(r) && r >= 0 ? Math.max(m, r) : m;
  }, -1);
  let changed = false;
  const next = lists.map((e) => {
    let runId = e.heatmapListRunId;
    if (typeof runId !== 'number' || !Number.isFinite(runId) || runId < 0) {
      maxId += 1;
      runId = maxId;
      changed = true;
      return { ...e, heatmapListRunId: runId };
    }
    maxId = Math.max(maxId, runId);
    return e;
  });
  return { lists: next, changed };
}

/**
 * Loads persisted lists, migrating from legacy `movie-chain-state` when needed.
 * Persists v1 and removes legacy after migration.
 */
export function loadChainListsPersisted(
  defaultListName: string,
  pendingActorKey: string
): ChainListsPersisted {
  try {
    const v1raw = localStorage.getItem(CHAIN_LISTS_STORAGE_KEY);
    if (v1raw) {
      const parsed = JSON.parse(v1raw) as ChainListsPersisted;
      if (
        parsed?.version === 1 &&
        typeof parsed.activeListId === 'string' &&
        Array.isArray(parsed.lists) &&
        parsed.lists.length > 0
      ) {
        const listsRaw = parsed.lists.map((e) => ({
          ...e,
          name: typeof e.name === 'string' ? e.name : defaultListName,
          state: normalizeChainState(e.state, pendingActorKey),
        }));
        const { lists, changed } = assignHeatmapListRunIds(listsRaw);
        const activeExists = lists.some((l) => l.id === parsed.activeListId);
        const activeListId = activeExists ? parsed.activeListId : lists[0].id;
        const result = { version: 1, activeListId, lists };
        if (changed) {
          try {
            localStorage.setItem(CHAIN_LISTS_STORAGE_KEY, JSON.stringify(result));
          } catch {
            // ignore
          }
        }
        return result;
      }
    }
  } catch {
    // fall through
  }

  try {
    const legacy = localStorage.getItem(LEGACY_CHAIN_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as ChainState;
      const state = normalizeChainState(parsed, pendingActorKey);
      const entry = newListEntry(defaultListName, state, defaultListName, 0);
      const blob: ChainListsPersisted = {
        version: 1,
        activeListId: entry.id,
        lists: [entry],
      };
      localStorage.setItem(CHAIN_LISTS_STORAGE_KEY, JSON.stringify(blob));
      localStorage.removeItem(LEGACY_CHAIN_STORAGE_KEY);
      return blob;
    }
  } catch {
    // ignore
  }

  const entry = newListEntry(defaultListName, createEmptyChainState(), defaultListName, 0);
  const blob: ChainListsPersisted = {
    version: 1,
    activeListId: entry.id,
    lists: [entry],
  };
  try {
    localStorage.setItem(CHAIN_LISTS_STORAGE_KEY, JSON.stringify(blob));
  } catch {
    // ignore
  }
  return blob;
}

export function saveChainListsPersisted(data: ChainListsPersisted) {
  const toSave: ChainListsPersisted = {
    ...data,
    lists: data.lists.map((e) => ({
      ...e,
      state: { ...e.state, prependMode: false },
    })),
  };
  localStorage.setItem(CHAIN_LISTS_STORAGE_KEY, JSON.stringify(toSave));
}
