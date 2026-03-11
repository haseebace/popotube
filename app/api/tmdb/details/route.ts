import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

export async function GET(request: Request) {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    return NextResponse.json({ error: 'TMDb API key is not configured.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get('tmdb_id');

    if (!tmdbId) {
      return NextResponse.json({ error: 'TMDB ID is required.' }, { status: 400 });
    }

    // append_to_response to fetch videos, credits, etc. in one request
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?append_to_response=credits,videos&language=en-US&api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
        if (response.status === 404) {
            return NextResponse.json({ error: 'Movie not found.' }, { status: 404 });
        }
      throw new Error(`TMDb API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching movie details:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
