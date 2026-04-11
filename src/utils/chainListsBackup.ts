import type { ChainState } from '../types/movie';
import {
  assignHeatmapListRunIds,
  CHAIN_LIST_NAME_MAX_LENGTH,
  normalizeChainState,
  type ChainListEntry,
  type ChainListsPersisted,
} from '../types/chainLists';
import {
  CHAIN_EXPORT_APP,
  CHAIN_EXPORT_FILE_VERSION,
  type ChainListsExportFile,
} from '../types/chainListsExport';

/** Must match `PENDING_ACTOR_KEY` in useChain.ts for normalizeChainState. */
export const BACKUP_PENDING_ACTOR_KEY = 'pending-actor-pick';

export class ChainListsBackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChainListsBackupError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateChainListsPersisted(raw: unknown): ChainListsPersisted {
  if (!isRecord(raw)) {
    throw new ChainListsBackupError('Invalid backup: root must be an object');
  }
  if (raw.version !== 1) {
    throw new ChainListsBackupError('Invalid backup: unsupported data.version');
  }
  if (typeof raw.activeListId !== 'string' || !raw.activeListId) {
    throw new ChainListsBackupError('Invalid backup: missing activeListId');
  }
  if (!Array.isArray(raw.lists) || raw.lists.length === 0) {
    throw new ChainListsBackupError('Invalid backup: lists must be a non-empty array');
  }

  const lists: ChainListEntry[] = [];
  for (const entry of raw.lists) {
    if (!isRecord(entry)) {
      throw new ChainListsBackupError('Invalid backup: list entry must be an object');
    }
    if (typeof entry.name !== 'string') {
      throw new ChainListsBackupError('Invalid backup: list name must be a string');
    }
    if (!isRecord(entry.state)) {
      throw new ChainListsBackupError('Invalid backup: list state must be an object');
    }
    if (!Array.isArray(entry.state.links)) {
      throw new ChainListsBackupError('Invalid backup: list state.links must be an array');
    }
    const hr = entry.heatmapListRunId;
    lists.push({
      id: typeof entry.id === 'string' ? entry.id : '',
      name: entry.name,
      state: entry.state as unknown as ChainState,
      ...(typeof hr === 'number' && Number.isFinite(hr) && hr >= 0 ? { heatmapListRunId: Math.floor(hr) } : {}),
    });
  }

  return {
    version: 1,
    activeListId: raw.activeListId,
    lists,
  };
}

/**
 * Parses JSON text from a backup file or raw persisted blob.
 * Accepts wrapped {@link ChainListsExportFile} or bare `ChainListsPersisted`.
 */
export function parseChainListsBackupJson(text: string): ChainListsPersisted {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new ChainListsBackupError('Invalid backup: not valid JSON');
  }

  if (!isRecord(parsed)) {
    throw new ChainListsBackupError('Invalid backup: root must be an object');
  }

  if (parsed.app === CHAIN_EXPORT_APP && parsed.exportVersion === CHAIN_EXPORT_FILE_VERSION) {
    if (!isRecord(parsed.data)) {
      throw new ChainListsBackupError('Invalid backup: missing data');
    }
    return validateChainListsPersisted(parsed.data);
  }

  return validateChainListsPersisted(parsed);
}

/**
 * Assigns new list IDs and normalizes chain state; sets active to first list.
 */
export function prepareImportedListsReplace(
  data: ChainListsPersisted,
  pendingKey: string
): ChainListsPersisted {
  const mapped = data.lists.map((entry) => ({
    id: crypto.randomUUID(),
    name: entry.name.slice(0, CHAIN_LIST_NAME_MAX_LENGTH),
    state: normalizeChainState(entry.state, pendingKey),
  }));
  const lists = assignHeatmapListRunIds(mapped).lists;
  return {
    version: 1,
    activeListId: lists[0].id,
    lists,
  };
}

/**
 * Appends imported lists with new IDs; names deduplicated with numeric suffixes.
 * Keeps current activeListId if it still exists.
 */
export function prepareImportedListsMerge(
  current: ChainListsPersisted,
  imported: ChainListsPersisted,
  pendingKey: string
): ChainListsPersisted {
  const usedNames = new Set(current.lists.map((e) => e.name));

  const nextLists: ChainListEntry[] = [...current.lists];

  for (const entry of imported.lists) {
    let name = entry.name.slice(0, CHAIN_LIST_NAME_MAX_LENGTH);
    if (usedNames.has(name)) {
      let n = 2;
      let candidate = `${entry.name} (${n})`.slice(0, CHAIN_LIST_NAME_MAX_LENGTH);
      while (usedNames.has(candidate)) {
        n += 1;
        candidate = `${entry.name} (${n})`.slice(0, CHAIN_LIST_NAME_MAX_LENGTH);
      }
      name = candidate;
    }
    usedNames.add(name);
    nextLists.push({
      id: crypto.randomUUID(),
      name,
      state: normalizeChainState(entry.state, pendingKey),
    });
  }

  const lists = assignHeatmapListRunIds(nextLists).lists;
  const activeExists = lists.some((e) => e.id === current.activeListId);
  return {
    version: 1,
    activeListId: activeExists ? current.activeListId : lists[0].id,
    lists,
  };
}

export function buildExportJsonFile(persisted: ChainListsPersisted): string {
  const wrapper: ChainListsExportFile = {
    app: CHAIN_EXPORT_APP,
    exportVersion: CHAIN_EXPORT_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    data: persisted,
  };
  return JSON.stringify(wrapper, null, 2);
}

/** Single-list snapshot for export (same schema as full backup; one entry in `lists`). */
export function persistedSnapshotForSingleList(entry: ChainListEntry): ChainListsPersisted {
  return {
    version: 1,
    activeListId: entry.id,
    lists: [entry],
  };
}

/** Safe segment for download filenames (Windows + general). */
export function sanitizeExportFilenameSegment(name: string, maxLen: number): string {
  const trimmed = name
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.+$/g, '');
  const base = trimmed || 'list';
  return base.length > maxLen ? base.slice(0, maxLen) : base;
}

export function backupFilenameForListJson(listName: string): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const safe = sanitizeExportFilenameSegment(listName, 48);
  return `movie-chain-list-${safe}-${y}-${m}-${day}.json`;
}

export function backupFilenameForListCsv(listName: string): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const safe = sanitizeExportFilenameSegment(listName, 48);
  return `movie-chain-list-${safe}-${y}-${m}-${day}.csv`;
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function backupFilenameJson(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `movie-chain-backup-${y}-${m}-${day}.json`;
}

export function backupFilenameCsv(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `movie-chain-lists-${y}-${m}-${day}.csv`;
}
