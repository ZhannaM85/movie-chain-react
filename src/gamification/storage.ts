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
      actorCastAppearanceCounts:
        parsed.actorCastAppearanceCounts && typeof parsed.actorCastAppearanceCounts === 'object'
          ? parsed.actorCastAppearanceCounts
          : {},
      castAppearanceMoviesSeen: (() => {
        const p = parsed as Record<string, unknown>;
        if (
          p.castAppearanceMoviesSeen &&
          typeof p.castAppearanceMoviesSeen === 'object' &&
          !Array.isArray(p.castAppearanceMoviesSeen)
        ) {
          return p.castAppearanceMoviesSeen as Record<string, true>;
        }
        const legacy = p.castAppearanceMoviesProcessed;
        if (Array.isArray(legacy)) {
          const seen: Record<string, true> = {};
          for (const id of legacy) {
            if (typeof id === 'string') seen[id] = true;
          }
          return seen;
        }
        return {};
      })(),
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
