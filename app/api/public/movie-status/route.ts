import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // using service role for guaranteed access if needed, or anon if RLS allows public read
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get('tmdb_id');

    if (!tmdbId) {
      return NextResponse.json({ error: 'tmdb_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('videos')
      .select('id, status, stream_url, progress, title, error_message')
      .eq('tmdb_id', parseInt(tmdbId, 10))
      .maybeSingle();

    if (error) {
      console.error('Supabase error checking movie status:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: true, video: data });
  } catch (error: any) {
    console.error('Error checking movie status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
