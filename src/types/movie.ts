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

export interface ChainLink {
  movie: Movie;
  connectingActorId: number | null;
  connectingActorName: string | null;
  comment: string;
}

export interface ChainState {
  links: ChainLink[];
  currentStep: 'pick-actor' | 'pick-movie' | 'start';
  selectedActorId: number | null;
  excludedActorId: number | null;
}
