import type { ChainLink } from '../types/movie';

export interface BridgeActorStep {
  fromTitle: string;
  toTitle: string;
}

/** Actor ids that have already been used as a bridge between consecutive films (links after the first). */
export function usedBridgeActorIds(links: ChainLink[]): Set<number> {
  const ids = new Set<number>();
  for (let i = 1; i < links.length; i++) {
    const id = links[i].connectingActorId;
    if (id != null) ids.add(id);
  }
  return ids;
}

/**
 * For each stored bridge actor, the adjacent movies in the step they linked (later steps overwrite if the same id repeats).
 */
export function bridgeActorStepByActorId(links: ChainLink[]): Map<number, BridgeActorStep> {
  const map = new Map<number, BridgeActorStep>();
  for (let i = 1; i < links.length; i++) {
    const id = links[i].connectingActorId;
    if (id == null) continue;
    map.set(id, {
      fromTitle: links[i - 1].movie.title,
      toTitle: links[i].movie.title,
    });
  }
  return map;
}

export interface CrossListEntry {
  listName: string;
  /** YYYY-MM-DD calendar day, or null when the link had no loggedDate. */
  date: string | null;
}

export interface CrossListUsage {
  /** Movie ID → list entries it appeared in (across all non-active lists). */
  movieIds: Map<number, CrossListEntry[]>;
  /** Bridge actor ID → list entries it was used as a bridge in (across all non-active lists). */
  bridgeActorIds: Map<number, CrossListEntry[]>;
}

const EMPTY_CROSS_LIST_USAGE: CrossListUsage = {
  movieIds: new Map(),
  bridgeActorIds: new Map(),
};

/** Format a YYYY-MM-DD date as DD.MM.YYYY for display. */
function formatDateForDisplay(date: string): string {
  const [y, m, d] = date.split('-');
  return `${d}.${m}.${y}`;
}

/** "ListName (DD.MM.YYYY)" or just "ListName" when date is absent. */
export function formatCrossListEntries(entries: CrossListEntry[]): string {
  return entries
    .map((e) => (e.date ? `${e.listName} (${formatDateForDisplay(e.date)})` : e.listName))
    .join(', ');
}

/**
 * Scans all non-active lists to build lookup maps of movies and bridge actors
 * already used, keyed by their IDs with the list names and dates they appeared in.
 */
export function crossListUsage(
  lists: readonly { id: string; name: string; state: { links: ChainLink[] } }[],
  activeListId: string,
): CrossListUsage {
  if (lists.length <= 1) return EMPTY_CROSS_LIST_USAGE;

  const movieIds = new Map<number, CrossListEntry[]>();
  const bridgeActorIds = new Map<number, CrossListEntry[]>();

  for (const entry of lists) {
    if (entry.id === activeListId) continue;
    const { links } = entry.state;
    for (const link of links) {
      const arr = movieIds.get(link.movie.id);
      const item: CrossListEntry = { listName: entry.name, date: link.loggedDate ?? null };
      if (arr) {
        if (!arr.some((e) => e.listName === entry.name)) arr.push(item);
      } else {
        movieIds.set(link.movie.id, [item]);
      }
    }
    for (let i = 1; i < links.length; i++) {
      const actorId = links[i].connectingActorId;
      if (actorId == null) continue;
      const arr = bridgeActorIds.get(actorId);
      const item: CrossListEntry = { listName: entry.name, date: links[i].loggedDate ?? null };
      if (arr) {
        if (!arr.some((e) => e.listName === entry.name)) arr.push(item);
      } else {
        bridgeActorIds.set(actorId, [item]);
      }
    }
  }

  return { movieIds, bridgeActorIds };
}
