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
  /** Latest local YYYY-MM-DD with heatmap activity; kept in sync with streak computation. */
  lastStreakDate: string | null;
  currentStreak: number;
  /** Max consecutive local calendar days with ≥1 movie on the heatmap (historical best). */
  longestStreakEver: number;
  /** Total challenge points earned across all sessions */
  totalChallengePointsAllTime: number;
  /** Movies added to a chain per calendar day (start + each link) — denormalized total for streaks / busiest day */
  moviesAddedByDate: Record<string, number>;
  /** Per calendar day, per chain run (strike id) — source of truth for heatmap breakdown */
  moviesAddedByDateByStrike: Record<string, Record<string, number>>;
  /** Run id assigned to the next chain started after a full list clear (reset / delete list). */
  heatmapNextRunId: number;
  /** Count of times each actor was chosen as the bridge to the next film (key = TMDB/KP id string) */
  actorBridgeCounts: Record<string, { name: string; count: number }>;
  /** Destination movie ids (one per distinct film) when that actor was the bridge — for stats / actor page */
  actorBridgeMovieIds: Record<string, number[]>;
  /** How many chain movies each actor appears in (full credits), once per movie per actor */
  actorCastAppearanceCounts: Record<string, { name: string; count: number }>;
  /** Per movie id: actor id → name from the last full-cast merge (used to rebuild counts for the current chain) */
  movieCastByMovie: Record<string, Record<string, string>>;
  /** Movie ids for which we already merged full cast into actorCastAppearanceCounts */
  castAppearanceMoviesSeen: Record<string, true>;
  /** Best chain length when starting from that day's daily challenge (YYYY-MM-DD UTC) */
  dailyBestByDate: Record<string, number>;
  hasWrittenNoteBefore: boolean;
  /** Milestone values (100, 200, …) for which the “100+ movies” modal was dismissed. */
  moviesMilestoneModalsAcknowledged: number[];
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
  moviesAddedByDateByStrike: {},
  heatmapNextRunId: 0,
  actorBridgeCounts: {},
  actorBridgeMovieIds: {},
  actorCastAppearanceCounts: {},
  movieCastByMovie: {},
  castAppearanceMoviesSeen: {},
  dailyBestByDate: {},
  hasWrittenNoteBefore: false,
  moviesMilestoneModalsAcknowledged: [],
};
