import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL =
  process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

export async function GET(request: Request) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key_here") {
    return NextResponse.json(
      { error: "TMDb API key is not configured." },
      { status: 500 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const page = searchParams.get("page") || "1";

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required." },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=${page}&api_key=${TMDB_API_KEY}`,
    );

    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      results?: Array<{ media_type?: string }>;
    };
    const results = (data.results ?? []).filter(
      (r) => r.media_type === "movie" || r.media_type === "tv",
    );
    return NextResponse.json({ ...data, results });
  } catch (error: unknown) {
    console.error("Error fetching search results:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
