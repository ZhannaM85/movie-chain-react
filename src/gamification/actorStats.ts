import type { ChainLink, MovieCredits } from '../types/movie';
import type { GamificationProfile } from './types';
import type { MovieApi } from '../services/movieApi';

/** Same billed-cast window as `castAppearances.ts` (snapshots / merge). */
const MAX_CAST_PER_MOVIE_STATS = 200;

/** True if full credits include this person id (authoritative vs. local cast snapshots). */
export function creditsIncludeActor(credits: MovieCredits | undefined, actorId: number): boolean {
  if (!credits?.cast?.length) return false;
  return credits.cast.some((a) => a.id === actorId);
}

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

/** Unique film ids in chain order (each film once). */
export function uniqueChainMovieIds(links: ChainLink[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const l of links) {
    if (!seen.has(l.movie.id)) {
      seen.add(l.movie.id);
      out.push(l.movie.id);
    }
  }
  return out;
}

/**
 * Full-cast leaderboard for the current chain from live API credits (matches actor page verification).
 */
export async function fetchTopCastAppearancesFromApi(
  links: ChainLink[],
  api: MovieApi,
  limit = 12
): Promise<ActorBridgeRank[]> {
  const ids = uniqueChainMovieIds(links);
  if (ids.length === 0) return [];

  const creditResults = await Promise.all(
    ids.map(async (mid) => {
      try {
        return await api.getMovieCredits(mid);
      } catch {
        return null;
      }
    })
  );

  const byActor: Record<string, { name: string; count: number }> = {};
  for (const credits of creditResults) {
    if (!credits?.cast?.length) continue;
    const slice = credits.cast.slice(0, MAX_CAST_PER_MOVIE_STATS);
    const seenInMovie = new Set<number>();
    for (const actor of slice) {
      if (!actor?.id || seenInMovie.has(actor.id)) continue;
      seenInMovie.add(actor.id);
      const idStr = String(actor.id);
      const prev = byActor[idStr];
      byActor[idStr] = {
        name: prev?.name ?? actor.name,
        count: (prev?.count ?? 0) + 1,
      };
    }
  }

  return Object.entries(byActor)
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

function castSnapshotHasActor(castMap: Record<string, string> | undefined, actorIdStr: string): boolean {
  if (!castMap) return false;
  if (castMap[actorIdStr] != null) return true;
  const n = Number(actorIdStr);
  if (!Number.isFinite(n)) return false;
  for (const k of Object.keys(castMap)) {
    if (Number(k) === n) return true;
  }
  return false;
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
    if (castSnapshotHasActor(snap[mid], actorIdStr) && !seen.has(link.movie.id)) {
      seen.add(link.movie.id);
      out.push(link.movie.id);
    }
  }
  return out;
}
