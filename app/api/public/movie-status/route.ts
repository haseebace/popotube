import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3001';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get('tmdb_id');

    if (!tmdbId) {
      return NextResponse.json({ error: 'tmdb_id is required' }, { status: 400 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/api/movie-status?tmdb_id=${tmdbId}`, {
      next: { revalidate: 0 } // never cache status polling
    });

    if (!backendRes.ok) {
        const errorData = await backendRes.text();
        return NextResponse.json({ error: 'Failed to fetch status from backend', details: errorData }, { status: backendRes.status });
    }

    const backendData = await backendRes.json();
    return NextResponse.json(backendData);

  } catch (error: any) {
    console.error('Error proxying movie status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
