import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:3001";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      tmdb_id: unknown;
      title: unknown;
      year?: unknown;
      watch_flow_id?: unknown;
      media_type?: unknown;
      season_number?: unknown;
      episode_number?: unknown;
    };

    const { tmdb_id, title, year, watch_flow_id } = body;

    if (!tmdb_id || !title) {
      return NextResponse.json(
        { error: "tmdb_id and title are required" },
        { status: 400 },
      );
    }

    const mediaType =
      body.media_type === "tv" || body.media_type === "movie"
        ? body.media_type
        : undefined;
    const seasonNum =
      typeof body.season_number === "number" ? body.season_number : undefined;
    const episodeNum =
      typeof body.episode_number === "number" ? body.episode_number : undefined;

    // Proxy the public ingestion job (Torrentio lookup + scoring + BullMQ queueing) to Fastify
    const backendRes = await fetch(`${BACKEND_URL}/api/trigger-ingestion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdb_id: parseInt(String(tmdb_id), 10),
        title,
        year,
        ...(typeof watch_flow_id === "string" && watch_flow_id
          ? { watch_flow_id }
          : {}),
        ...(mediaType === "tv" && seasonNum != null && episodeNum != null
          ? {
              media_type: "tv" as const,
              season_number: seasonNum,
              episode_number: episodeNum,
            }
          : {}),
      }),
    });

    if (!backendRes.ok) {
      const errorData = await backendRes.text();
      return NextResponse.json(
        { error: "Failed to trigger backend ingestion", details: errorData },
        { status: backendRes.status },
      );
    }

    const backendData = await backendRes.json();

    return NextResponse.json(backendData);
  } catch (error: unknown) {
    console.error("Error triggering ingestion:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
