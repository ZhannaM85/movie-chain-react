export const ACHIEVEMENT_IDS = [
  'chain_5',
  'chain_10',
  'chain_20',
  'first_note',
  'three_decades',
] as const;

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export interface GamificationProfile {
  longestChainEver: number;
  totalLinksAddedAllTime: number;
  unlockedAchievementIds: string[];
  lastStreakDate: string | null;
  currentStreak: number;
  /** Best chain length when starting from that day's daily challenge (YYYY-MM-DD UTC) */
  dailyBestByDate: Record<string, number>;
  hasWrittenNoteBefore: boolean;
}

export const DEFAULT_GAMIFICATION_PROFILE: GamificationProfile = {
  longestChainEver: 0,
  totalLinksAddedAllTime: 0,
  unlockedAchievementIds: [],
  lastStreakDate: null,
  currentStreak: 0,
  dailyBestByDate: {},
  hasWrittenNoteBefore: false,
};
