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
    const tvId = searchParams.get("tv_id");
    const season = searchParams.get("season_number");
    if (!tvId || season == null) {
      return NextResponse.json(
        { error: "tv_id and season_number are required" },
        { status: 400 },
      );
    }

    const url = `${TMDB_BASE_URL}/tv/${encodeURIComponent(tvId)}/season/${encodeURIComponent(season)}?language=en-US&api_key=${TMDB_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json(
        { error: `TMDb error: ${res.statusText}` },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
