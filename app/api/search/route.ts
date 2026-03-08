import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim() === "") {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  const JACKETT_URL = process.env.JACKETT_URL || "http://127.0.0.1:9117";
  const JACKETT_API_KEY = process.env.JACKETT_API_KEY;

  if (!JACKETT_API_KEY || JACKETT_API_KEY === "your_api_key_here") {
    return NextResponse.json(
      {
        error:
          "Jackett API key not configured. Please set JACKETT_API_KEY in your .env.local file.",
      },
      { status: 500 }
    );
  }

  const jackettEndpoint = `${JACKETT_URL}/api/v2.0/indexers/all/results?apikey=${JACKETT_API_KEY}&Query=${encodeURIComponent(query)}&_=${Date.now()}`;

  try {
    const response = await fetch(jackettEndpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      // 15 second timeout - Jackett can be slow when querying many indexers
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Jackett returned an error: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Jackett returns { Results: [...], Indexers: [...] }
    // Normalize the results for easy consumption by the UI
    const results = (data.Results || []).map(
      (item: {
        Title: string;
        Tracker: string;
        TrackerId: string;
        CategoryDesc: string;
        Size: number;
        Seeders: number;
        Peers: number;
        PublishDate: string;
        MagnetUri: string;
        Link: string;
        Details: string;
        Imdb: string | null;
        InfoHash: string | null;
      }) => ({
        title: item.Title,
        tracker: item.Tracker,
        trackerId: item.TrackerId,
        category: item.CategoryDesc,
        size: item.Size,
        seeders: item.Seeders,
        leechers: item.Peers,
        publishDate: item.PublishDate,
        magnetUri: item.MagnetUri,
        downloadLink: item.Link,
        detailsLink: item.Details,
        imdb: item.Imdb,
        infoHash: item.InfoHash,
      })
    );

    return NextResponse.json({
      query,
      totalResults: results.length,
      results,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json(
        {
          error:
            "Jackett request timed out. Make sure Jackett is running at " +
            JACKETT_URL,
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to connect to Jackett. Make sure it is running at " +
          JACKETT_URL,
      },
      { status: 503 }
    );
  }
}
