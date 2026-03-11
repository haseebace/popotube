import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

export async function GET(request: Request) {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    return NextResponse.json({ error: 'TMDb API key is not configured.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const timeWindow = searchParams.get('time_window') || 'day'; // day or week
    const page = searchParams.get('page') || '1';

    const response = await fetch(
      `${TMDB_BASE_URL}/trending/movie/${timeWindow}?language=en-US&page=${page}&api_key=${TMDB_API_KEY}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching trending movies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
