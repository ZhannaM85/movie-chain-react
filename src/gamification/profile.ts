import { normalizeLoggedDateForHeatmap } from '../lib/dateUtils';
import { mergeMoviesAddedByDateWithChainLinks } from './heatmap';
import { computeStreakMetricsFromDailyCounts } from './streakFromHeatmap';
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

/**
 * Undoes one `incrementActorBridge` for the given destination film (first matching id in the list).
 */
export function decrementActorBridge(
  profile: GamificationProfile,
  actorId: number,
  bridgeToMovieId: number
): GamificationProfile {
  const key = String(actorId);
  const prevIds = profile.actorBridgeMovieIds[key];
  if (!prevIds?.length) return profile;

  const idx = prevIds.indexOf(bridgeToMovieId);
  if (idx < 0) return profile;

  const nextIds = [...prevIds.slice(0, idx), ...prevIds.slice(idx + 1)];
  const prevCount = profile.actorBridgeCounts[key];
  const count = (prevCount?.count ?? 0) - 1;

  const actorBridgeMovieIds = { ...profile.actorBridgeMovieIds };
  const actorBridgeCounts = { ...profile.actorBridgeCounts };

  if (nextIds.length === 0) {
    delete actorBridgeMovieIds[key];
  } else {
    actorBridgeMovieIds[key] = nextIds;
  }

  if (count <= 0 || !prevCount) {
    delete actorBridgeCounts[key];
  } else {
    actorBridgeCounts[key] = { name: prevCount.name, count };
  }

  return { ...profile, actorBridgeMovieIds, actorBridgeCounts };
}

function effectiveFirstEntryKind(first: ChainLink | undefined): 'start' | 'prepend' | 'append' {
  if (first?.entryKind != null) return first.entryKind;
  return 'start';
}

/**
 * Reverses `afterAddMovie` / daily for removing the **last** link (tail).
 */
export function reverseAfterRemoveLast(profile: GamificationProfile, linksBefore: ChainLink[]): GamificationProfile {
  if (linksBefore.length === 0) return profile;
  const L = linksBefore[linksBefore.length - 1];
  let next = {
    ...profile,
    totalLinksAddedAllTime: Math.max(0, profile.totalLinksAddedAllTime - 1),
    totalChallengePointsAllTime: Math.max(
      0,
      profile.totalChallengePointsAllTime - (L.stepDifficulty ?? 0)
    ),
  };
  if (L.connectingActorId != null && L.connectingActorName) {
    next = decrementActorBridge(next, L.connectingActorId, L.movie.id);
  }
  if (L.loggedDate?.trim()) {
    next = decrementDailyMovies(next, L.loggedDate.trim());
  }
  return next;
}

/**
 * Reverses gamification when removing the **first** link.
 * - Single link: only reverses heatmap entry from `recordStartMovie` (streak not inverted).
 * - Two+ links: reverses the step onto the old second film and how the first link entered (`start` vs `prepend`).
 */
export function reverseAfterRemoveFirst(profile: GamificationProfile, linksBefore: ChainLink[]): GamificationProfile {
  if (linksBefore.length === 0) return profile;
  const removed = linksBefore[0];

  if (linksBefore.length === 1) {
    let next = profile;
    if (removed.loggedDate?.trim()) {
      next = decrementDailyMovies(next, removed.loggedDate.trim());
    }
    return next;
  }

  const second = linksBefore[1];
  const kind = effectiveFirstEntryKind(removed);

  let next: GamificationProfile = {
    ...profile,
    totalChallengePointsAllTime: Math.max(
      0,
      profile.totalChallengePointsAllTime - (second.stepDifficulty ?? 0)
    ),
  };

  if (kind === 'prepend') {
    next = {
      ...next,
      totalLinksAddedAllTime: Math.max(0, next.totalLinksAddedAllTime - 1),
    };
  }

  const actor = second.connectingActorId;
  const actorName = second.connectingActorName;
  if (actor != null && actorName) {
    const bridgeToMovieId = kind === 'prepend' ? removed.movie.id : second.movie.id;
    next = decrementActorBridge(next, actor, bridgeToMovieId);
  }

  if ((kind === 'start' || kind === 'prepend') && removed.loggedDate?.trim()) {
    next = decrementDailyMovies(next, removed.loggedDate.trim());
  }

  return next;
}

/**
 * Sets {@link GamificationProfile.currentStreak} / {@link GamificationProfile.longestStreakEver} from the same
 * merged per-day counts as the stats heatmap (storage + current chain logged dates).
 */
export function syncProfileStreakFromHeatmapData(
  profile: GamificationProfile,
  links: ChainLink[]
): GamificationProfile {
  const merged = mergeMoviesAddedByDateWithChainLinks(profile.moviesAddedByDate, links);
  const m = computeStreakMetricsFromDailyCounts(merged);
  const longestEver = Math.max(profile.longestStreakEver, m.longestConsecutiveEver);
  if (
    profile.currentStreak === m.currentStreak &&
    profile.longestStreakEver === longestEver &&
    profile.lastStreakDate === m.lastActivityDate
  ) {
    return profile;
  }
  return {
    ...profile,
    currentStreak: m.currentStreak,
    longestStreakEver: longestEver,
    lastStreakDate: m.lastActivityDate,
  };
}

/** One movie logged for the chosen calendar day (starting a chain). */
export function recordStartMovie(profile: GamificationProfile, loggedDateForHeatmap: string): GamificationProfile {
  let next = incrementDailyMovies(profile, 1, loggedDateForHeatmap);
  return syncProfileStreakFromHeatmapData(next, []);
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
  next = incrementDailyMovies(next, 1, newMovieLink.loggedDate ?? undefined);
  if (stepLink?.connectingActorId != null && stepLink.connectingActorName) {
    next = incrementActorBridge(
      next,
      stepLink.connectingActorId,
      stepLink.connectingActorName,
      newMovieLink.movie.id
    );
  }
  next = syncProfileStreakFromHeatmapData(next, linksAfterAdd);

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
