import { utcDateString } from './profile';

/**
 * Deterministic index into the trending list for the daily challenge.
 */
export function getDailyMovieIndex(trendingLength: number, dateStr: string = utcDateString()): number {
  if (trendingLength <= 0) return 0;
  let h = 2166136261;
  for (let i = 0; i < dateStr.length; i++) {
    h ^= dateStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % trendingLength;
}
