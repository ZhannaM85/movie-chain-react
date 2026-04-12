/**
 * Random single pick only considers the top of the current list so picks stay in the same
 * “first screen” band as the default grids (and filmography stays well-populated for TMDB).
 */
export const RANDOM_SINGLE_PICK_POOL_MAX = 12;

/** When the current window has no selectable items, grow the window by this many rows. */
export const RANDOM_SINGLE_PICK_POOL_EXPAND_STEP = 5;

/**
 * Eligible actors from an initial billing-order window ({@link RANDOM_SINGLE_PICK_POOL_MAX} rows).
 * If every slot in the window is a bridge actor, the window grows by
 * {@link RANDOM_SINGLE_PICK_POOL_EXPAND_STEP} until some eligible actor exists or the cast ends.
 */
export function eligibleActorIdsForRandomPick(
  cast: { id: number }[],
  bridgeActorIds: Set<number>,
  initialWindow: number = RANDOM_SINGLE_PICK_POOL_MAX,
  expandStep: number = RANDOM_SINGLE_PICK_POOL_EXPAND_STEP
): number[] {
  if (cast.length === 0) return [];
  let end = Math.min(initialWindow, cast.length);
  while (true) {
    const pool = cast
      .slice(0, end)
      .filter((a) => !bridgeActorIds.has(a.id))
      .map((a) => a.id);
    if (pool.length > 0) return pool;
    if (end >= cast.length) return [];
    end = Math.min(end + expandStep, cast.length);
  }
}

/**
 * Eligible movies from an initial window of rows in sort/search order.
 * If every title in that window is already in the chain, the window grows by
 * {@link RANDOM_SINGLE_PICK_POOL_EXPAND_STEP} until some eligible title exists or the list ends.
 */
export function eligibleMovieIdsForRandomPick(
  orderedMovies: { id: number }[],
  chainMovieIds: Set<number>,
  initialWindow: number = RANDOM_SINGLE_PICK_POOL_MAX,
  expandStep: number = RANDOM_SINGLE_PICK_POOL_EXPAND_STEP
): number[] {
  if (orderedMovies.length === 0) return [];
  let end = Math.min(initialWindow, orderedMovies.length);
  while (true) {
    const pool = orderedMovies
      .slice(0, end)
      .filter((m) => !chainMovieIds.has(m.id))
      .map((m) => m.id);
    if (pool.length > 0) return pool;
    if (end >= orderedMovies.length) return [];
    end = Math.min(end + expandStep, orderedMovies.length);
  }
}

/**
 * Picks one id uniformly from a non-empty ordered list of distinct candidates.
 * `rng` should return values in [0, 1) (e.g. Math.random).
 */
export function pickRandomSelectableId(ids: number[], rng: () => number): number | null {
  if (ids.length === 0) return null;
  const idx = Math.floor(rng() * ids.length);
  return ids[Math.min(idx, ids.length - 1)];
}
