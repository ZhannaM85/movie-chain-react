import type { ChainLink } from '../types/movie';

export interface ChainRecap {
  length: number;
  totalDifficulty: number;
  uniqueActors: number;
  yearSpan: number | null;
  distinctDecades: number;
}

function releaseYear(link: ChainLink): number | null {
  const d = link.movie.release_date;
  if (!d) return null;
  const y = new Date(d).getFullYear();
  return Number.isFinite(y) ? y : null;
}

/**
 * Summary stats for the current chain (e.g. reset confirmation, overview).
 */
export function buildChainRecap(links: ChainLink[]): ChainRecap {
  const totalDifficulty = links.reduce((sum, l) => sum + (l.stepDifficulty ?? 0), 0);

  const actorIds = new Set<number>();
  for (const link of links) {
    if (link.connectingActorId != null) actorIds.add(link.connectingActorId);
  }
  const uniqueActors = actorIds.size;

  const years = links.map(releaseYear).filter((y): y is number => y != null);
  const yearSpan =
    years.length >= 2 ? Math.max(...years) - Math.min(...years) : years.length === 1 ? 0 : null;

  const decades = new Set<number>();
  for (const y of years) {
    decades.add(Math.floor(y / 10) * 10);
  }
  const distinctDecades = decades.size;

  return {
    length: links.length,
    totalDifficulty,
    uniqueActors,
    yearSpan,
    distinctDecades,
  };
}
