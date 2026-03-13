export function parseTorrentMetadata(title: string) {
  const quality = title.match(/2160p|4k|1080p|720p|480p/i)?.[0]?.toLowerCase() || 'unknown';
  const codec = title.match(/x265|h265|hevc|x264|h264|avc/i)?.[0]?.toLowerCase() || 'unknown';
  const source = title.match(/bluray|web-dl|webrip|hdrip|dvdrip/i)?.[0]?.toLowerCase() || 'unknown';
  
  return { quality, codec, source };
}
