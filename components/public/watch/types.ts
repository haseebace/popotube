export type WatchCastMember = {
  id: number;
  name: string;
  character?: string;
};

export type WatchSimilarMovie = {
  id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string;
};

/** JSON-safe payload from server page → WatchMovieExperience */
export type WatchMoviePayload = {
  id: number;
  title: string;
  tagline?: string;
  overview?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
  vote_average?: number;
  runtime?: number | null;
  release_date?: string;
  genres?: { id: number; name: string }[];
  credits?: {
    crew?: { id: number; name: string; job?: string }[];
    cast?: WatchCastMember[];
  };
  release_dates?: {
    results?: {
      iso_3166_1: string;
      release_dates: Array<{ certification: string }>;
    }[];
  };
  similar: WatchSimilarMovie[];
};
