/** TMDB genre_id → name (subset; unknown ids omitted in output). */
const GENRE_NAMES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export function genreSlashLine(
  genreIds: number[] | undefined,
  max = 2,
): string {
  if (!genreIds?.length) return "Feature";
  const labels = genreIds
    .slice(0, max)
    .map((id) => GENRE_NAMES[id])
    .filter(Boolean);
  return labels.length ? labels.join(" / ") : "Feature";
}
