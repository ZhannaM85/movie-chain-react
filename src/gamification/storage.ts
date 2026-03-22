import type { GamificationProfile } from './types';
import { DEFAULT_GAMIFICATION_PROFILE } from './types';

export const GAMIFICATION_STORAGE_KEY = 'movie-chain-gamification';

export function loadGamificationProfile(): GamificationProfile {
  try {
    const raw = localStorage.getItem(GAMIFICATION_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_GAMIFICATION_PROFILE };
    const parsed = JSON.parse(raw) as Partial<GamificationProfile>;
    return {
      ...DEFAULT_GAMIFICATION_PROFILE,
      ...parsed,
      unlockedAchievementIds: Array.isArray(parsed.unlockedAchievementIds)
        ? parsed.unlockedAchievementIds
        : [],
      dailyBestByDate:
        parsed.dailyBestByDate && typeof parsed.dailyBestByDate === 'object'
          ? parsed.dailyBestByDate
          : {},
    };
  } catch {
    return { ...DEFAULT_GAMIFICATION_PROFILE };
  }
}

export function saveGamificationProfile(profile: GamificationProfile): void {
  localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(profile));
}
