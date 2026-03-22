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
