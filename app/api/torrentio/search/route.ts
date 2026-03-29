import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

type TorrentioStream = {
  title?: string;
  name?: string;
  infoHash?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get('tmdbId');
  let imdbId = searchParams.get('imdbId');

  if (!imdbId && !tmdbId) {
    return NextResponse.json({ error: 'Missing tmdbId or imdbId' }, { status: 400 });
  }

  try {
    // 1. If we only have tmdbId, fetch the imdbId
    if (!imdbId && tmdbId) {
      if (!TMDB_API_KEY) {
        throw new Error('TMDB_API_KEY is not configured');
      }
      const tmdbRes = await fetch(
        `https://api.themoviedb.org/3/movie/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`
      );
      if (tmdbRes.ok) {
        const external = await tmdbRes.json();
        imdbId = external.imdb_id;
      }
    }

    if (!imdbId) {
      return NextResponse.json({ error: 'Could not find IMDB ID for this movie' }, { status: 404 });
    }

    // Helper to convert "2.1 GB" or "500 MB" to bytes
    const parseSizeToBytes = (sizeStr: string): number => {
        const match = sizeStr.match(/([0-9.]+)\s*(GB|MB|KB|B)/i);
        if (!match) return 0;
        const val = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        switch (unit) {
            case 'GB': return Math.floor(val * 1024 * 1024 * 1024);
            case 'MB': return Math.floor(val * 1024 * 1024);
            case 'KB': return Math.floor(val * 1024);
            default: return Math.floor(val);
        }
    };

    // 2. Query Torrentio
    // Default config: providers=yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrent9,horriblesubs,nyaasi,tokyotosho,sukebei
    // We use a public-ish config for now.
    const torrentioUrl = `https://torrentio.strem.fun/providers=yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrent9,horriblesubs,nyaasi,tokyotosho,sukebei/stream/movie/${imdbId}.json`;
    
    const response = await fetch(torrentioUrl);
    if (!response.ok) {
        throw new Error(`Torrentio returned ${response.status}`);
    }
    
    const data = (await response.json()) as { streams?: TorrentioStream[] };
    
    // Normalize Torrentio streams into a shared format for the UI
    const streams = data.streams || [];
    const results = streams.map((s) => {
        // Torrentio 'title' format is usually: "Title\nResolution | Size | Seeders | Tracker"
        // Example: "The Rip\n1080p | 2.1 GB | S: 45 L: 12 | YTS"
        const parts = (s.title || s.name || "").split('\n');
        const filename = parts[0];
        const infoLine = parts[1] || "";
        
        // Revised regex to support Torrentio's modern emoji-based format + legacy S:/L: format
        const seederMatch = infoLine.match(/(?:👤|S:)\s*([0-9]+)/i);
        const sizeMatch = infoLine.match(/(?:💾|size:)?\s*([0-9.]+\s*(GB|MB|KB|B))/i);
        
        const sizeStr = sizeMatch ? sizeMatch[1].trim() : 'Unknown';
        const seeders = seederMatch ? parseInt(seederMatch[1]) : 0;
        
        return {
            title: filename || s.name,
            sizeStr,
            sizeBytes: parseSizeToBytes(sizeStr) || 1, 
            seeders,
            magnetUri: s.infoHash ? `magnet:?xt=urn:btih:${s.infoHash}` : null,
            infoHash: s.infoHash,
            details: infoLine,
            source: s.name 
        };
    });

    return NextResponse.json({ results });

  } catch (err) {
    console.error("Torrentio search error:", err);
    const message =
      err instanceof Error ? err.message : "Torrentio search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
