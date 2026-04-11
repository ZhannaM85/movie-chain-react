import { normalizeLoggedDateForHeatmap } from '../lib/dateUtils';
import {
  mergeMoviesAddedByDateByStrikeWithChainLinks,
  sumStrikesForDate,
  totalPerDateFromByStrike,
} from './heatmap';
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

/** Best single number for “how many movies” badges: matches chain length UI vs cumulative adds. */
function moviesMilestoneScore(profile: GamificationProfile): number {
  return Math.max(profile.longestChainEver, profile.totalLinksAddedAllTime);
}

/**
 * Ensures `movies_100`, `movies_200`, … for every milestone already reached by
 * the max of longest chain length and total links added.
 */
export function ensureMoviesMilestoneAchievements(profile: GamificationProfile): GamificationProfile {
  const max = Math.floor(moviesMilestoneScore(profile) / 100) * 100;
  if (max < 100) return profile;

  let next = profile;
  for (let m = 100; m <= max; m += 100) {
    const id = `movies_${m}`;
    if (!next.unlockedAchievementIds.includes(id)) {
      next = addUnlocked(next, id);
    }
  }
  return next;
}

/**
 * Next movie-count milestone (100, 200, …) that qualifies for a celebration modal
 * but has not been dismissed yet.
 */
export function getPendingMoviesMilestoneModal(profile: GamificationProfile): number | null {
  const score = moviesMilestoneScore(profile);
  const maxM = Math.floor(score / 100) * 100;
  if (maxM < 100) return null;
  const ack = new Set(profile.moviesMilestoneModalsAcknowledged ?? []);
  for (let m = 100; m <= maxM; m += 100) {
    if (!ack.has(m)) return m;
  }
  return null;
}

export function acknowledgeMoviesMilestoneModal(
  profile: GamificationProfile,
  milestone: number
): GamificationProfile {
  if (milestone < 100 || milestone % 100 !== 0) return profile;
  const prev = profile.moviesMilestoneModalsAcknowledged ?? [];
  if (prev.includes(milestone)) return profile;
  return {
    ...profile,
    moviesMilestoneModalsAcknowledged: [...prev, milestone].sort((a, b) => a - b),
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

export function incrementDailyMoviesByStrike(
  profile: GamificationProfile,
  strikeId: number,
  by: number,
  dateStr?: string
): GamificationProfile {
  if (by === 0) return profile;
  const key = normalizeLoggedDateForHeatmap(dateStr);
  const sk = String(strikeId);
  const prevByDate = { ...(profile.moviesAddedByDateByStrike[key] ?? {}) };
  const nextVal = (prevByDate[sk] ?? 0) + by;
  if (nextVal < 0) return profile;
  if (nextVal === 0) delete prevByDate[sk];
  else prevByDate[sk] = nextVal;
  const nextStrikeMap = { ...profile.moviesAddedByDateByStrike };
  if (Object.keys(prevByDate).length === 0) delete nextStrikeMap[key];
  else nextStrikeMap[key] = prevByDate;
  const total = sumStrikesForDate(prevByDate);
  const moviesAddedByDate = { ...profile.moviesAddedByDate };
  if (total <= 0) delete moviesAddedByDate[key];
  else moviesAddedByDate[key] = total;
  return { ...profile, moviesAddedByDateByStrike: nextStrikeMap, moviesAddedByDate };
}

export function decrementDailyMoviesByStrike(
  profile: GamificationProfile,
  strikeId: number,
  dateStr: string,
  by = 1
): GamificationProfile {
  const key = dateStr?.trim();
  if (!key || by <= 0) return profile;
  const sk = String(strikeId);
  const prevByDate = { ...(profile.moviesAddedByDateByStrike[key] ?? {}) };
  const prev = prevByDate[sk] ?? 0;
  if (prev <= 0) return profile;
  const nextVal = Math.max(0, prev - by);
  if (nextVal === 0) delete prevByDate[sk];
  else prevByDate[sk] = nextVal;
  const nextStrikeMap = { ...profile.moviesAddedByDateByStrike };
  if (Object.keys(prevByDate).length === 0) delete nextStrikeMap[key];
  else nextStrikeMap[key] = prevByDate;
  const total = sumStrikesForDate(prevByDate);
  const moviesAddedByDate = { ...profile.moviesAddedByDate };
  if (total <= 0) delete moviesAddedByDate[key];
  else moviesAddedByDate[key] = total;
  return { ...profile, moviesAddedByDateByStrike: nextStrikeMap, moviesAddedByDate };
}

/**
 * Ensures per-strike daily counts reflect every link’s logged date (fixes missed increments, e.g. prepend / past dates).
 */
export function ensureDailyCountsFromLinks(
  profile: GamificationProfile,
  links: ChainLink[]
): GamificationProfile {
  const wanted = new Map<string, Map<string, number>>();
  for (const link of links) {
    const d = link.loggedDate?.trim();
    if (!d) continue;
    const sk = String(link.heatmapStrikeId ?? 0);
    if (!wanted.has(d)) wanted.set(d, new Map());
    const m = wanted.get(d)!;
    m.set(sk, (m.get(sk) ?? 0) + 1);
  }
  let next = profile;
  for (const [date, strikeMap] of wanted) {
    for (const [strike, need] of strikeMap) {
      const sid = Number(strike);
      const have = next.moviesAddedByDateByStrike[date]?.[strike] ?? 0;
      if (need > have) {
        next = incrementDailyMoviesByStrike(next, sid, need - have, date);
      }
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
  newDate: string | null | undefined,
  strikeId = 0
): GamificationProfile {
  const o = oldDate == null || oldDate === '' ? null : oldDate;
  const n = newDate == null || newDate === '' ? null : newDate;
  if (o === n) return profile;
  let next = profile;
  if (o) next = decrementDailyMoviesByStrike(next, strikeId, o);
  if (n) next = incrementDailyMoviesByStrike(next, strikeId, 1, n);
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
    next = decrementDailyMoviesByStrike(next, L.heatmapStrikeId ?? 0, L.loggedDate.trim());
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
      next = decrementDailyMoviesByStrike(next, removed.heatmapStrikeId ?? 0, removed.loggedDate.trim());
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
    next = decrementDailyMoviesByStrike(next, removed.heatmapStrikeId ?? 0, removed.loggedDate.trim());
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
  const mergedByStrike = mergeMoviesAddedByDateByStrikeWithChainLinks(
    profile.moviesAddedByDateByStrike,
    links
  );
  const merged = totalPerDateFromByStrike(mergedByStrike);
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
  let next = incrementDailyMoviesByStrike(profile, profile.heatmapNextRunId, 1, loggedDateForHeatmap);
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
  const strikeForLink = newMovieLink.heatmapStrikeId ?? 0;

  let next: GamificationProfile = {
    ...profile,
    totalLinksAddedAllTime: profile.totalLinksAddedAllTime + 1,
    longestChainEver: Math.max(profile.longestChainEver, newLength),
    totalChallengePointsAllTime: profile.totalChallengePointsAllTime + stepPoints,
  };
  next = incrementDailyMoviesByStrike(next, strikeForLink, 1, newMovieLink.loggedDate ?? undefined);
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

  const prevScore = moviesMilestoneScore(profile);
  const nextScore = moviesMilestoneScore(next);
  if (nextScore > 0 && nextScore % 100 === 0 && prevScore < nextScore) {
    pushAch(`movies_${nextScore}`);
  }

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
