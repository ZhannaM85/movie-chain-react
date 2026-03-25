import type { ChainLink } from '../types/movie';

/**
 * Chain index for the home hero: the link with the latest `loggedDate` (YYYY-MM-DD).
 * On ties (same calendar day), prefers the higher index (later in array order).
 * If no link has a logged date, returns the tail index (`links.length - 1`).
 */
export function findHeroChainIndexByLastWatched(links: ChainLink[]): number {
  if (links.length === 0) return 0;
  let bestDate: string | null = null;
  let bestIndex = links.length - 1;

  for (let i = 0; i < links.length; i++) {
    const raw = links[i].loggedDate?.trim();
    if (!raw) continue;
    if (bestDate == null || raw > bestDate) {
      bestDate = raw;
      bestIndex = i;
    } else if (raw === bestDate && i > bestIndex) {
      bestIndex = i;
    }
  }

  if (bestDate == null) {
    return links.length - 1;
  }
  return bestIndex;
}
