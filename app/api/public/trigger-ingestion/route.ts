import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:3001";

export async function POST(request: Request) {
  try {
    const { tmdb_id, title, year, watch_flow_id } = await request.json();

    if (!tmdb_id || !title) {
      return NextResponse.json(
        { error: "tmdb_id and title are required" },
        { status: 400 },
      );
    }

    // Proxy the public ingestion job (Torrentio lookup + scoring + BullMQ queueing) to Fastify
    const backendRes = await fetch(`${BACKEND_URL}/api/trigger-ingestion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdb_id: parseInt(tmdb_id, 10),
        title,
        year,
        ...(typeof watch_flow_id === "string" && watch_flow_id
          ? { watch_flow_id }
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
