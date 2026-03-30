import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:3001";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get("tmdb_id");
    const watchFlowId = searchParams.get("watch_flow_id");

    if (!tmdbId) {
      return NextResponse.json(
        { error: "tmdb_id is required" },
        { status: 400 },
      );
    }

    const qs = new URLSearchParams({ tmdb_id: tmdbId });
    if (watchFlowId) {
      qs.set("watch_flow_id", watchFlowId);
    }
    const season = searchParams.get("season");
    const episode = searchParams.get("episode");
    if (season != null && season !== "") qs.set("season", season);
    if (episode != null && episode !== "") qs.set("episode", episode);

    const backendRes = await fetch(
      `${BACKEND_URL}/api/movie-status?${qs.toString()}`,
      {
        next: { revalidate: 0 }, // never cache status polling
      },
    );

    if (!backendRes.ok) {
      const errorData = await backendRes.text();
      return NextResponse.json(
        { error: "Failed to fetch status from backend", details: errorData },
        { status: backendRes.status },
      );
    }

    const backendData = await backendRes.json();
    return NextResponse.json(backendData);
  } catch (error: unknown) {
    console.error("Error proxying movie status:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
