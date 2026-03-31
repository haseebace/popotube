import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:3001";
const INTERNAL_KEY =
  process.env.BACKEND_INTERNAL_API_KEY ||
  process.env.INTERNAL_API_KEY ||
  process.env.MEDIAFLOW_API_PASSWORD ||
  "";

export async function POST(request: Request) {
  try {
    if (!INTERNAL_KEY) {
      return NextResponse.json(
        { error: "Internal API key is not configured" },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      video_id?: string;
    };

    if (!body.video_id) {
      return NextResponse.json(
        { error: "video_id is required" },
        { status: 400 },
      );
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/internal/force-hls`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-key": INTERNAL_KEY,
      },
      body: JSON.stringify({ video_id: body.video_id }),
      cache: "no-store",
    });

    const payload = await backendRes.json().catch(() => ({}));
    if (!backendRes.ok) {
      return NextResponse.json(
        { error: "Failed to switch playback", details: payload },
        { status: backendRes.status },
      );
    }

    return NextResponse.json(payload);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
