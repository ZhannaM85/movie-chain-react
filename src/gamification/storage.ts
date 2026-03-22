import type { GamificationProfile } from './types';
import { DEFAULT_GAMIFICATION_PROFILE } from './types';

export const GAMIFICATION_STORAGE_KEY = 'movie-chain-gamification';

export function loadGamificationProfile(): GamificationProfile {
  try {
    const raw = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GAMIFICATION_PROFILE };
    const parsed = JSON.parse(raw) as Partial<GamificationProfile>;
    const merged: GamificationProfile = {
      ...DEFAULT_GAMIFICATION_PROFILE,
      ...parsed,
      unlockedAchievementIds: Array.isArray(parsed.unlockedAchievementIds)
        ? parsed.unlockedAchievementIds
        : [],
      dailyBestByDate:
        parsed.dailyBestByDate && typeof parsed.dailyBestByDate === 'object'
          ? parsed.dailyBestByDate
          : {},
      moviesAddedByDate:
        parsed.moviesAddedByDate && typeof parsed.moviesAddedByDate === 'object'
          ? parsed.moviesAddedByDate
          : {},
      actorBridgeCounts:
        parsed.actorBridgeCounts && typeof parsed.actorBridgeCounts === 'object'
          ? parsed.actorBridgeCounts
          : {},
    };
    merged.longestStreakEver = Math.max(merged.longestStreakEver, merged.currentStreak);
    return merged;
  } catch {
    return { ...DEFAULT_GAMIFICATION_PROFILE };
  }
}

export function saveGamificationProfile(profile: GamificationProfile): void {
  localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(profile));
}
