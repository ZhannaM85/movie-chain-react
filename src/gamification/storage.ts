import { ensureMoviesMilestoneAchievements } from './profile';
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
      moviesAddedByDateByStrike: (() => {
        const raw = (parsed as { moviesAddedByDateByStrike?: unknown }).moviesAddedByDateByStrike;
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          const out: Record<string, Record<string, number>> = {};
          for (const [date, strikes] of Object.entries(raw)) {
            if (strikes && typeof strikes === 'object' && !Array.isArray(strikes)) {
              const inner: Record<string, number> = {};
              for (const [sk, v] of Object.entries(strikes)) {
                if (typeof v === 'number' && Number.isFinite(v) && v > 0) inner[sk] = v;
              }
              if (Object.keys(inner).length > 0) out[date] = inner;
            }
          }
          return out;
        }
        return {};
      })(),
      heatmapNextRunId:
        typeof (parsed as { heatmapNextRunId?: unknown }).heatmapNextRunId === 'number' &&
        Number.isFinite((parsed as { heatmapNextRunId: number }).heatmapNextRunId)
          ? Math.max(0, Math.floor((parsed as { heatmapNextRunId: number }).heatmapNextRunId))
          : 0,
      actorBridgeCounts:
        parsed.actorBridgeCounts && typeof parsed.actorBridgeCounts === 'object'
          ? parsed.actorBridgeCounts
          : {},
      actorBridgeMovieIds:
        parsed.actorBridgeMovieIds && typeof parsed.actorBridgeMovieIds === 'object'
          ? parsed.actorBridgeMovieIds
          : {},
      actorCastAppearanceCounts:
        parsed.actorCastAppearanceCounts && typeof parsed.actorCastAppearanceCounts === 'object'
          ? parsed.actorCastAppearanceCounts
          : {},
      movieCastByMovie:
        parsed.movieCastByMovie && typeof parsed.movieCastByMovie === 'object'
          ? parsed.movieCastByMovie
          : {},
      moviesMilestoneModalsAcknowledged: Array.isArray(parsed.moviesMilestoneModalsAcknowledged)
        ? parsed.moviesMilestoneModalsAcknowledged.filter(
            (n): n is number => typeof n === 'number' && n >= 100 && n % 100 === 0
          )
        : [],
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

    let migratedStrike = false;
    if (Object.keys(merged.moviesAddedByDateByStrike).length === 0) {
      const flat = merged.moviesAddedByDate;
      if (flat && typeof flat === 'object') {
        const nextByStrike: Record<string, Record<string, number>> = {};
        for (const [date, n] of Object.entries(flat)) {
          if (typeof n === 'number' && Number.isFinite(n) && n > 0) {
            nextByStrike[date] = { '0': n };
          }
        }
        if (Object.keys(nextByStrike).length > 0) {
          merged.moviesAddedByDateByStrike = nextByStrike;
          migratedStrike = true;
        }
      }
    }

    merged.longestStreakEver = Math.max(merged.longestStreakEver, merged.currentStreak);

    const hasCastSnapshots = Object.keys(merged.movieCastByMovie).length > 0;
    const hadSeenWithoutSnapshots =
      !hasCastSnapshots && Object.keys(merged.castAppearanceMoviesSeen).length > 0;
    if (hadSeenWithoutSnapshots) {
      merged.castAppearanceMoviesSeen = {};
      merged.actorCastAppearanceCounts = {};
    }

    const result = ensureMoviesMilestoneAchievements(merged);
    if (hadSeenWithoutSnapshots || migratedStrike || result !== merged) {
      saveGamificationProfile(result);
    }
    return result;
  } catch {
    return { ...DEFAULT_GAMIFICATION_PROFILE };
  }
}

export function saveGamificationProfile(profile: GamificationProfile): void {
  localStorage.setItem(GAMIFICATION_STORAGE_KEY, JSON.stringify(profile));
}
