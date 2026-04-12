/**
 * Picks one id uniformly from a non-empty ordered list of distinct candidates.
 * `rng` should return values in [0, 1) (e.g. Math.random).
 */
export function pickRandomSelectableId(ids: number[], rng: () => number): number | null {
  if (ids.length === 0) return null;
  const idx = Math.floor(rng() * ids.length);
  return ids[Math.min(idx, ids.length - 1)];
}
