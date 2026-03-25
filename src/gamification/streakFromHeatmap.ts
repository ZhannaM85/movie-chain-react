import { localDateString } from '../lib/dateUtils';

/** Local calendar +/- n days from YYYY-MM-DD (noon anchor avoids DST edge cases). */
function addDaysLocal(dateStr: string, deltaDays: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return localDateString(d);
}

export interface StreakMetricsFromCounts {
  /** Consecutive local days with ≥1 movie, ending at the most recent day that has activity. */
  currentStreak: number;
  /** Longest run of consecutive local days with ≥1 movie in the merged history. */
  longestConsecutiveEver: number;
  /** Latest YYYY-MM-DD with count &gt; 0, or null if none. */
  lastActivityDate: string | null;
}

/**
 * Derives streak stats from the same per-day counts as the activity heatmap
 * (merged profile storage + current chain logged dates).
 */
export function computeStreakMetricsFromDailyCounts(counts: Record<string, number>): StreakMetricsFromCounts {
  const activeDates = Object.keys(counts)
    .filter((k) => (counts[k] ?? 0) > 0)
    .sort();
  if (activeDates.length === 0) {
    return { currentStreak: 0, longestConsecutiveEver: 0, lastActivityDate: null };
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < activeDates.length; i++) {
    if (activeDates[i] === addDaysLocal(activeDates[i - 1], 1)) {
      run++;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
  }

  const end = activeDates[activeDates.length - 1];
  let currentStreak = 0;
  let d = end;
  while ((counts[d] ?? 0) > 0) {
    currentStreak++;
    d = addDaysLocal(d, -1);
  }

  return {
    currentStreak,
    longestConsecutiveEver: longest,
    lastActivityDate: end,
  };
}
