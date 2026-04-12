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

export interface CrossListUsage {
  /** Movie ID → list name(s) it appeared in (across all non-active lists). */
  movieIds: Map<number, string[]>;
  /** Bridge actor ID → list name(s) it was used as a bridge in (across all non-active lists). */
  bridgeActorIds: Map<number, string[]>;
}

const EMPTY_CROSS_LIST_USAGE: CrossListUsage = {
  movieIds: new Map(),
  bridgeActorIds: new Map(),
};

/**
 * Scans all non-active lists to build lookup maps of movies and bridge actors
 * already used, keyed by their IDs with the list names they appeared in.
 */
export function crossListUsage(
  lists: readonly { id: string; name: string; state: { links: ChainLink[] } }[],
  activeListId: string,
): CrossListUsage {
  if (lists.length <= 1) return EMPTY_CROSS_LIST_USAGE;

  const movieIds = new Map<number, string[]>();
  const bridgeActorIds = new Map<number, string[]>();

  for (const entry of lists) {
    if (entry.id === activeListId) continue;
    const { links } = entry.state;
    for (const link of links) {
      const existing = movieIds.get(link.movie.id);
      if (existing) {
        if (!existing.includes(entry.name)) existing.push(entry.name);
      } else {
        movieIds.set(link.movie.id, [entry.name]);
      }
    }
    for (let i = 1; i < links.length; i++) {
      const actorId = links[i].connectingActorId;
      if (actorId == null) continue;
      const existing = bridgeActorIds.get(actorId);
      if (existing) {
        if (!existing.includes(entry.name)) existing.push(entry.name);
      } else {
        bridgeActorIds.set(actorId, [entry.name]);
      }
    }
  }

  return { movieIds, bridgeActorIds };
}
