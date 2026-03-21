import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';

export async function GET(request: Request) {
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
    return NextResponse.json({ error: 'TMDb API key is not configured.' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const with_genres = searchParams.get('with_genres');
    const with_watch_providers = searchParams.get('with_watch_providers');
    const watch_region = searchParams.get('watch_region') || 'US';
    const page = searchParams.get('page') || '1';
    const sort_by = searchParams.get('sort_by') || 'popularity.desc';

    let url = `${TMDB_BASE_URL}/discover/movie?include_adult=false&language=en-US&page=${page}&sort_by=${sort_by}&api_key=${TMDB_API_KEY}`;
    if (with_genres) {
      url += `&with_genres=${with_genres}`;
    }
    if (with_watch_providers) {
      url += `&with_watch_providers=${with_watch_providers}&watch_region=${watch_region}`;
    }

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching discover movies:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
