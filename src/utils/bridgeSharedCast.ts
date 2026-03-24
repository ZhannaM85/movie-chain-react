import type { MovieApi } from '../services/movieApi';

/** Same window as other cast merges — top-billed first via `order`. */
const MAX_CAST = 200;

/**
 * Finds a shared cast member between two films (lowest `order` = most prominent billing).
 * Used when the chain link has no stored bridge actor (legacy / lost session data).
 */
export async function resolveSharedBridgeActor(
  api: MovieApi,
  previousMovieId: number,
  nextMovieId: number
): Promise<{ id: number; name: string } | null> {
  try {
    const [prevCredits, nextCredits] = await Promise.all([
      api.getMovieCredits(previousMovieId),
      api.getMovieCredits(nextMovieId),
    ]);
    const prevIds = new Set(
      prevCredits.cast.slice(0, MAX_CAST).filter((a) => a?.id).map((a) => a.id)
    );
    const shared = nextCredits.cast
      .slice(0, MAX_CAST)
      .filter((a) => a?.id && prevIds.has(a.id));
    if (shared.length === 0) return null;
    shared.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    const first = shared[0];
    return { id: first.id, name: first.name };
  } catch {
    return null;
  }
}
