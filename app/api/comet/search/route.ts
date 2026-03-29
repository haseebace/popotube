import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const COMET_URL = process.env.COMET_URL || "http://localhost:8000";

type CometStream = {
  title?: string;
  name?: string;
  description?: string;
  behaviorHints?: { filename?: string };
  infoHash?: string;
  url?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get('tmdbId');
  let imdbId = searchParams.get('imdbId');

  if (!imdbId && !tmdbId) {
    return NextResponse.json({ error: 'Missing tmdbId or imdbId' }, { status: 400 });
  }

  try {
    // 1. Fetch IMDB ID if we only have TMDB ID
    if (!imdbId && tmdbId) {
      if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY not configured');
      const tmdbRes = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`);
      if (tmdbRes.ok) {
        const external = await tmdbRes.json();
        imdbId = external.imdb_id;
      }
    }

    if (!imdbId) return NextResponse.json({ error: 'IMDB ID not found' }, { status: 404 });

    // 2. Query Comet
    const cometUrl = `${COMET_URL}/stream/movie/${imdbId}.json`;
    console.log(`📡 [Comet] Querying: ${cometUrl}`);
    
    const response = await fetch(cometUrl);
    if (!response.ok) throw new Error(`Comet returned ${response.status}`);
    
    const data = (await response.json()) as { streams?: CometStream[] };
    const streams = data.streams ?? [];

    // Helper: Parse size to bytes
    const parseSizeToBytes = (sizeStr: string): number => {
        const match = sizeStr.match(/([0-9.]+)\s*(GB|MB|KB|B)/i);
        if (!match) return 0;
        const val = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        switch (unit) {
            case 'GB': return Math.floor(val * 1024 * 1024 * 1024);
            case 'MB': return Math.floor(val * 1024 * 1024);
            default: return Math.floor(val);
        }
    };

    // 3. Normalize Comet results
    // Comet usually follows a clean format or similar to Stremio.
    const results = streams.map((s) => {
        // Title parsing - Comet titles vary, but we'll try to extract size/seeds
        // Comet includes the actual seeders/size markers (e.g. "👤 104", "💾 75.0 GB")
        // in `description`, while `name` is often just a generic label.
        const infoLine = s.description || s.title || s.name || "";
        const sizeMatch = infoLine.match(/💾\s*([0-9.]+\s*(GB|MB|KB|B))/i) || infoLine.match(/([0-9.]+\s*(GB|MB|KB|B))/i);
        // Comet can expose seeders either as emoji-based "👤 45" or as legacy "S: 45" style.
        // Support both so UI can render correct seeders counts.
        const seederMatch =
            infoLine.match(/👤\s*([0-9]+)/i) ||
            infoLine.match(/(?:S:|Seeders?:)\s*([0-9]+)/i);

        const sizeStr = sizeMatch ? sizeMatch[1].trim() : 'Unknown';
        const seeders = seederMatch ? parseInt(seederMatch[1]) : 0;
        const infoHash = s.infoHash || s.url?.match(/btih:([a-zA-Z0-9]+)/)?.[1];

        return {
            title: s.behaviorHints?.filename || s.name || "Unknown Filename",
            sizeStr,
            sizeBytes: parseSizeToBytes(sizeStr) || 1,
            seeders,
            magnetUri: infoHash ? `magnet:?xt=urn:btih:${infoHash}` : null,
            infoHash,
            details: infoLine,
            source: s.name || "Comet"
        };
    });

    return NextResponse.json({ results });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('❌ [Comet] API Error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
