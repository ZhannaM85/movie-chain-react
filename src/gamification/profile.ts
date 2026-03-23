import { normalizeLoggedDateForHeatmap } from '../lib/dateUtils';
import type { ChainLink } from '../types/movie';
import type { GamificationProfile } from './types';

export function utcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function addUnlocked(profile: GamificationProfile, id: string): GamificationProfile {
  if (profile.unlockedAchievementIds.includes(id)) return profile;
  return {
    ...profile,
    unlockedAchievementIds: [...profile.unlockedAchievementIds, id],
  };
}

function countDistinctDecades(links: ChainLink[]): number {
  const decades = new Set<number>();
  for (const link of links) {
    const d = link.movie.release_date;
    if (!d) continue;
    const y = new Date(d).getFullYear();
    if (Number.isFinite(y)) decades.add(Math.floor(y / 10) * 10);
  }
  return decades.size;
}

function withLongestStreakEver(profile: GamificationProfile): GamificationProfile {
  return {
    ...profile,
    longestStreakEver: Math.max(profile.longestStreakEver, profile.currentStreak),
  };
}

export function incrementDailyMovies(
  profile: GamificationProfile,
  by: number,
  dateStr?: string
): GamificationProfile {
  const key = normalizeLoggedDateForHeatmap(dateStr);
  const next = (profile.moviesAddedByDate[key] ?? 0) + by;
  return {
    ...profile,
    moviesAddedByDate: {
      ...profile.moviesAddedByDate,
      [key]: next,
    },
  };
}

export function decrementDailyMovies(profile: GamificationProfile, dateStr: string): GamificationProfile {
  const key = dateStr?.trim();
  if (!key) return profile;
  const prev = profile.moviesAddedByDate[key] ?? 0;
  if (prev <= 0) return profile;
  const next = prev - 1;
  const moviesAddedByDate = { ...profile.moviesAddedByDate };
  if (next <= 0) delete moviesAddedByDate[key];
  else moviesAddedByDate[key] = next;
  return { ...profile, moviesAddedByDate };
}

/**
 * Ensures moviesAddedByDate reflects every link’s logged date (fixes missed increments, e.g. prepend / past dates).
 */
export function ensureDailyCountsFromLinks(
  profile: GamificationProfile,
  links: ChainLink[]
): GamificationProfile {
  const wanted = new Map<string, number>();
  for (const link of links) {
    const d = link.loggedDate?.trim();
    if (!d) continue;
    wanted.set(d, (wanted.get(d) ?? 0) + 1);
  }
  let next = profile;
  for (const [date, need] of wanted) {
    const have = next.moviesAddedByDate[date] ?? 0;
    if (need > have) {
      next = incrementDailyMovies(next, need - have, date);
    }
  }
  return next;
}

/**
 * Moves one movie between heatmap days when the user edits `loggedDate`.
 * If `oldDate` was never set, only increments `newDate` (no decrement).
 */
export function adjustDailyForLoggedDateChange(
  profile: GamificationProfile,
  oldDate: string | null | undefined,
  newDate: string | null | undefined
): GamificationProfile {
  const o = oldDate == null || oldDate === '' ? null : oldDate;
  const n = newDate == null || newDate === '' ? null : newDate;
  if (o === n) return profile;
  let next = profile;
  if (o) next = decrementDailyMovies(next, o);
  if (n) next = incrementDailyMovies(next, 1, n);
  return next;
}

export function incrementActorBridge(
  profile: GamificationProfile,
  actorId: number,
  actorName: string,
  bridgeToMovieId: number
): GamificationProfile {
  const key = String(actorId);
  const prev = profile.actorBridgeCounts[key];
  const count = (prev?.count ?? 0) + 1;
  const prevIds = profile.actorBridgeMovieIds[key] ?? [];
  const nextIds = prevIds.includes(bridgeToMovieId) ? prevIds : [...prevIds, bridgeToMovieId];
  return {
    ...profile,
    actorBridgeCounts: {
      ...profile.actorBridgeCounts,
      [key]: { name: actorName, count },
    },
    actorBridgeMovieIds: {
      ...profile.actorBridgeMovieIds,
      [key]: nextIds,
    },
  };
}

const applyStreak = (profile: GamificationProfile): GamificationProfile => {
  const today = utcDateString();
  if (profile.lastStreakDate === today) {
    return withLongestStreakEver(profile);
  }

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yStr = utcDateString(yesterday);

  let nextStreak = profile.currentStreak;
  if (profile.lastStreakDate === null) {
    nextStreak = 1;
  } else if (profile.lastStreakDate === yStr) {
    nextStreak = profile.currentStreak + 1;
  } else {
    nextStreak = 1;
  }

  return withLongestStreakEver({
    ...profile,
    lastStreakDate: today,
    currentStreak: nextStreak,
  });
};

export { applyStreak };

/** Streak + one movie logged for the chosen calendar day (starting a chain). */
export function recordStartMovie(profile: GamificationProfile, loggedDateForHeatmap: string): GamificationProfile {
  let next = applyStreak(profile);
  next = incrementDailyMovies(next, 1, loggedDateForHeatmap);
  return next;
}

export interface AfterAddMovieResult {
  profile: GamificationProfile;
  newAchievements: string[];
  /** True when current chain length exceeds previous longestChainEver before this step */
  beatPersonalBest: boolean;
}

/**
 * @param newLinkIndex - Index of the newly added movie (0 when prepending, `length - 1` when appending).
 */
export function afterAddMovie(
  profile: GamificationProfile,
  linksAfterAdd: ChainLink[],
  newLinkIndex: number
): AfterAddMovieResult {
  const prevLongest = profile.longestChainEver;
  const newLength = linksAfterAdd.length;

  const stepLinkIndex = newLinkIndex === 0 ? 1 : newLinkIndex;
  const stepLink = linksAfterAdd[stepLinkIndex];
  const stepPoints = stepLink?.stepDifficulty ?? 0;

  const newMovieLink = linksAfterAdd[newLinkIndex];

  let next: GamificationProfile = {
    ...profile,
    totalLinksAddedAllTime: profile.totalLinksAddedAllTime + 1,
    longestChainEver: Math.max(profile.longestChainEver, newLength),
    totalChallengePointsAllTime: profile.totalChallengePointsAllTime + stepPoints,
  };
  next = applyStreak(next);
  next = incrementDailyMovies(next, 1, newMovieLink.loggedDate ?? undefined);
  if (stepLink?.connectingActorId != null && stepLink.connectingActorName) {
    next = incrementActorBridge(
      next,
      stepLink.connectingActorId,
      stepLink.connectingActorName,
      newMovieLink.movie.id
    );
  }

  const newAchievements: string[] = [];
  const pushAch = (id: string) => {
    if (!next.unlockedAchievementIds.includes(id)) {
      next = addUnlocked(next, id);
      newAchievements.push(id);
    }
  };

  if (newLength >= 5) pushAch('chain_5');
  if (newLength >= 10) pushAch('chain_10');
  if (newLength >= 20) pushAch('chain_20');
  if (countDistinctDecades(linksAfterAdd) >= 3) pushAch('three_decades');

  const beatPersonalBest = newLength > prevLongest && newLength >= 2;

  return { profile: next, newAchievements, beatPersonalBest };
}

export interface AfterFirstNoteResult {
  profile: GamificationProfile;
  newAchievements: string[];
}

export function afterFirstNote(profile: GamificationProfile): AfterFirstNoteResult {
  if (profile.hasWrittenNoteBefore) {
    return { profile, newAchievements: [] };
  }

  let next = { ...profile, hasWrittenNoteBefore: true };
  next = applyStreak(next);

  const newAchievements: string[] = [];
  if (!next.unlockedAchievementIds.includes('first_note')) {
    next = addUnlocked(next, 'first_note');
    newAchievements.push('first_note');
  }

  return { profile: next, newAchievements };
}

export function finalizeChainReset(
  profile: GamificationProfile,
  links: ChainLink[],
  dailyChallengeDate: string | null | undefined
): GamificationProfile {
  const length = links.length;
  let next = {
    ...profile,
    longestChainEver: Math.max(profile.longestChainEver, length),
  };

  if (dailyChallengeDate && length > 0) {
    const prevBest = next.dailyBestByDate[dailyChallengeDate] ?? 0;
    if (length > prevBest) {
      next = {
        ...next,
        dailyBestByDate: { ...next.dailyBestByDate, [dailyChallengeDate]: length },
      };
    }
  }

  return next;
}
