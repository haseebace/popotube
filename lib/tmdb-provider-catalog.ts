export type ProviderCatalogMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average?: number;
};

export type ProviderCatalogPage = {
  results: ProviderCatalogMovie[];
  page: number;
  total_pages: number;
  total_results: number;
};

export async function fetchProviderCatalogPage(
  tmdbProviderId: number,
  page: number,
): Promise<ProviderCatalogPage | null> {
  const key = process.env.TMDB_API_KEY;
  const base = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
  if (!key || key === "your_tmdb_api_key_here") return null;

  const url = new URL(`${base}/discover/movie`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", String(page));
  url.searchParams.set("sort_by", "popularity.desc");
  url.searchParams.set("with_watch_providers", String(tmdbProviderId));
  url.searchParams.set("watch_region", "US");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    results?: ProviderCatalogMovie[];
    page?: number;
    total_pages?: number;
    total_results?: number;
  };

  return {
    results: data.results ?? [],
    page: data.page ?? page,
    total_pages: data.total_pages ?? 1,
    total_results: data.total_results ?? 0,
  };
}
