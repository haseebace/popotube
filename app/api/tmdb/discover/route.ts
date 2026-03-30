import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL =
  process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

function sortByTrendingPriority(
  items: Array<{ id: number }>,
  trendingIds: number[],
) {
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

export async function GET(request: Request) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key_here") {
    return NextResponse.json(
      { error: "TMDb API key is not configured." },
      { status: 500 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const mediaType = searchParams.get("media_type") === "tv" ? "tv" : "movie";
    const with_genres = searchParams.get("with_genres");
    const with_watch_providers = searchParams.get("with_watch_providers");
    const watch_region = searchParams.get("watch_region") || "US";
    const page = searchParams.get("page") || "1";
    const sort_by = searchParams.get("sort_by") || "popularity.desc";
    const prioritizeTrending = searchParams.get("prioritize_trending") === "1";

    let url = `${TMDB_BASE_URL}/discover/${mediaType}?include_adult=false&language=en-US&page=${page}&sort_by=${sort_by}&api_key=${TMDB_API_KEY}`;
    if (with_genres) {
      url += `&with_genres=${with_genres}`;
    }
    if (with_watch_providers) {
      url += `&with_watch_providers=${with_watch_providers}&watch_region=${watch_region}`;
    }

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      results?: Array<{ id: number }>;
      page?: number;
      total_pages?: number;
      total_results?: number;
      [key: string]: unknown;
    };

    if (prioritizeTrending && Array.isArray(data.results)) {
      const trendingRes = await fetch(
        `${TMDB_BASE_URL}/trending/${mediaType}/week?language=en-US&page=1&api_key=${TMDB_API_KEY}`,
        { next: { revalidate: 3600 } },
      );
      if (trendingRes.ok) {
        const trending = (await trendingRes.json()) as {
          results?: Array<{ id: number }>;
        };
        const trendingIds = (trending.results ?? []).map((x) => x.id);
        data.results = sortByTrendingPriority(data.results, trendingIds);
      }
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error fetching discover movies:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
