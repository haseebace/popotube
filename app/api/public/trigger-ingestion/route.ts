import { NextResponse } from 'next/server';

const JACKETT_URL = process.env.JACKETT_URL || "http://127.0.0.1:9117";
const JACKETT_API_KEY = process.env.JACKETT_API_KEY;
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3001';

export async function POST(request: Request) {
  try {
    const { tmdb_id, title, year } = await request.json();

    if (!tmdb_id || !title) {
       return NextResponse.json({ error: 'tmdb_id and title are required' }, { status: 400 });
    }

    if (!JACKETT_API_KEY || JACKETT_API_KEY === "your_api_key_here") {
      return NextResponse.json({ error: "Jackett API key not configured." }, { status: 500 });
    }

    // 1. Search Jackett for the movie
    const query = `${title} ${year || ''}`.trim();
    const jackettEndpoint = `${JACKETT_URL}/api/v2.0/indexers/all/results?apikey=${JACKETT_API_KEY}&Query=${encodeURIComponent(query)}&_=${Date.now()}`;
    
    const searchRes = await fetch(jackettEndpoint, {
      signal: AbortSignal.timeout(15000),
    });

    if (!searchRes.ok) {
       return NextResponse.json({ error: 'Failed to search Jackett' }, { status: 500 });
    }

    const data = await searchRes.json();
    const results = data.Results || [];

    // Filter results to those that have a magnetUri
    let validResults = results.filter((r: any) => r.MagnetUri);

    if (validResults.length === 0) {
      return NextResponse.json({ error: 'No magnet links found for this movie' }, { status: 404 });
    }

    // Sort by Seeders * Size (prefer higher seeders and reasonable size)
    validResults = validResults.sort((a: any, b: any) => b.Seeders - a.Seeders);
    const bestResult = validResults[0];

    // 2. Transmit to backend download endpoint
    const backendRes = await fetch(`${BACKEND_URL}/api/bunny-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
         magnet: bestResult.MagnetUri,
         size: bestResult.Size,
         title: title,
         tmdb_id: parseInt(tmdb_id, 10),
      })
    });

    if (!backendRes.ok) {
        const errorData = await backendRes.text();
        return NextResponse.json({ error: 'Failed to trigger backend ingestion', details: errorData }, { status: 500 });
    }

    const backendData = await backendRes.json();
    
    return NextResponse.json({
        success: true,
        message: 'Ingestion triggered',
        job: backendData
    });

  } catch (error: any) {
    console.error('Error triggering ingestion:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
