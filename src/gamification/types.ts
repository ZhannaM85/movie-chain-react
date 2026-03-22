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
  /** Max consecutive UTC days with any chain activity (play streak) */
  longestStreakEver: number;
  /** Total challenge points earned across all sessions */
  totalChallengePointsAllTime: number;
  /** Movies added to a chain per UTC day (start + each link) — for activity heatmap */
  moviesAddedByDate: Record<string, number>;
  /** Count of times each actor was chosen as the bridge to the next film (key = TMDB/KP id string) */
  actorBridgeCounts: Record<string, { name: string; count: number }>;
  /** How many chain movies each actor appears in (full credits), once per movie per actor */
  actorCastAppearanceCounts: Record<string, { name: string; count: number }>;
  /** Movie ids for which we already merged full cast into actorCastAppearanceCounts */
  castAppearanceMoviesSeen: Record<string, true>;
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
  longestStreakEver: 0,
  totalChallengePointsAllTime: 0,
  moviesAddedByDate: {},
  actorBridgeCounts: {},
  actorCastAppearanceCounts: {},
  castAppearanceMoviesSeen: {},
  dailyBestByDate: {},
  hasWrittenNoteBefore: false,
};
