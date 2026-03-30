export type TmdbMediaType = "movie" | "tv";

export type TmdbCatalogItem = {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
};

export type TmdbCatalogPage = {
  results: TmdbCatalogItem[];
  page: number;
  total_pages: number;
  total_results: number;
};

export type FetchTmdbCatalogOptions = {
  withWatchProviders?: string;
  watchRegion?: string;
};

function sortByTrendingPriority(
  items: TmdbCatalogItem[],
  trendingIds: number[],
): TmdbCatalogItem[] {
  if (trendingIds.length === 0) return items;
  const rank = new Map<number, number>();
  trendingIds.forEach((id, idx) => rank.set(id, idx));

  return [...items].sort((a, b) => {
    const ra = rank.get(a.id);
    const rb = rank.get(b.id);
    if (typeof ra === "number" && typeof rb === "number") return ra - rb;
    if (typeof ra === "number") return -1;
    if (typeof rb === "number") return 1;
    return 0;
  });
}

export async function fetchTmdbCatalogPage(
  mediaType: TmdbMediaType,
  page: number,
  options: FetchTmdbCatalogOptions = {},
): Promise<TmdbCatalogPage | null> {
  const key = process.env.TMDB_API_KEY;
  const base = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
  if (!key || key === "your_tmdb_api_key_here") return null;

  const url = new URL(`${base}/discover/${mediaType}`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", String(page));
  url.searchParams.set("sort_by", "popularity.desc");
  if (options.withWatchProviders) {
    url.searchParams.set("with_watch_providers", options.withWatchProviders);
    url.searchParams.set("watch_region", options.watchRegion || "US");
  }

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  const trendingUrl = new URL(`${base}/trending/${mediaType}/week`);
  trendingUrl.searchParams.set("api_key", key);
  trendingUrl.searchParams.set("language", "en-US");
  const trendingRes = await fetch(trendingUrl.toString(), {
    next: { revalidate: 3600 },
  });

  const data = (await res.json()) as {
    results?: TmdbCatalogItem[];
    page?: number;
    total_pages?: number;
    total_results?: number;
  };
  const trending = trendingRes.ok
    ? ((await trendingRes.json()) as { results?: Array<{ id: number }> })
    : null;
  const trendingIds = (trending?.results ?? []).map((x) => x.id);

  return {
    results: sortByTrendingPriority(data.results ?? [], trendingIds),
    page: data.page ?? page,
    total_pages: data.total_pages ?? 1,
    total_results: data.total_results ?? 0,
  };
}
