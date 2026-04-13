export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  tagline?: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Actor {
  id: number;
  name: string;
  profile_path: string | null;
  character?: string;
  popularity: number;
  order?: number;
  biography?: string;
  birthday?: string;
  place_of_birth?: string;
  known_for_department?: string;
}

export interface MovieCredits {
  id: number;
  cast: Actor[];
}

export interface ActorMovieCredits {
  id: number;
  cast: Movie[];
}

/** How this link was first added to the chain (for reversing gamification when removing an end). */
export type ChainLinkEntryKind = 'start' | 'prepend' | 'append';

export interface ChainLink {
  movie: Movie;
  connectingActorId: number | null;
  connectingActorName: string | null;
  comment: string;
  /** Local calendar day (YYYY-MM-DD) this link counts toward in “movies per day” / heatmap. */
  loggedDate?: string | null;
  /** Local time of day (HH:MM) when the movie was watched. */
  loggedTime?: string | null;
  /** Difficulty points for this step (set when linking via a shared actor). */
  stepDifficulty?: number;
  /** Set when the link is created; older saves omit — first link defaults to `start`. */
  entryKind?: ChainLinkEntryKind;
  /** Chain run id for heatmap coloring; assigned when the link is created (older saves omit → 0). */
  heatmapStrikeId?: number;
}

export type MovieSource = 'tmdb' | 'kinopoisk';

export interface ChainState {
  source?: MovieSource;
  links: ChainLink[];
  currentStep: 'pick-actor' | 'pick-movie' | 'start';
  selectedActorId: number | null;
  /** Mirrors the last pick-actor choice; used if sessionStorage is missing when a movie is added. */
  selectedActorName: string | null;
  /** When true, pick actor/movie to insert a link before the current first movie. */
  prependMode?: boolean;
  /** UTC date (YYYY-MM-DD) when this run started from the daily challenge */
  dailyChallengeDate?: string | null;
}
