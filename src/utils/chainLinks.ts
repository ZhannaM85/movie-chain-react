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
