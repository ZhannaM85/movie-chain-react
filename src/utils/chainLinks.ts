import type { ChainLink } from '../types/movie';

/** Actor ids that have already been used as a bridge between consecutive films (links after the first). */
export function usedBridgeActorIds(links: ChainLink[]): Set<number> {
  const ids = new Set<number>();
  for (let i = 1; i < links.length; i++) {
    const id = links[i].connectingActorId;
    if (id != null) ids.add(id);
  }
  return ids;
}
