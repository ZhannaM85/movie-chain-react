import type { ChainLink } from '../types/movie';
import type { GamificationProfile } from './types';

export interface ActorBridgeRank {
  id: string;
  name: string;
  count: number;
}

export function getTopActorBridges(profile: GamificationProfile, limit = 10): ActorBridgeRank[] {
  return Object.entries(profile.actorBridgeCounts)
    .map(([id, v]) => ({ id, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getTopCastAppearances(profile: GamificationProfile, limit = 12): ActorBridgeRank[] {
  return Object.entries(profile.actorCastAppearanceCounts)
    .map(([id, v]) => ({ id, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Movie ids where this actor was the bridge (persisted + current chain links). */
export function getBridgeMovieIdsForActor(
  profile: GamificationProfile,
  actorIdStr: string,
  links: ChainLink[]
): number[] {
  const fromProfile = profile.actorBridgeMovieIds[actorIdStr] ?? [];
  const fromLinks = links
    .filter((l) => l.connectingActorId != null && String(l.connectingActorId) === actorIdStr)
    .map((l) => l.movie.id);
  return Array.from(new Set([...fromProfile, ...fromLinks]));
}

/** Chain movies whose stored cast snapshot includes this actor (current chain only). */
export function getCastMovieIdsForActorInChain(
  profile: GamificationProfile,
  actorIdStr: string,
  links: ChainLink[]
): number[] {
  const snap = profile.movieCastByMovie ?? {};
  const out: number[] = [];
  const seen = new Set<number>();
  for (const link of links) {
    const mid = String(link.movie.id);
    if (snap[mid]?.[actorIdStr] && !seen.has(link.movie.id)) {
      seen.add(link.movie.id);
      out.push(link.movie.id);
    }
  }
  return out;
}
