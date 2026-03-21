export interface TorrentMetadata {
  quality: string;
  codec: string;
  source: string;
}

export function parseTorrentMetadata(title: string): TorrentMetadata {
  const qualityMatch = title.match(/(2160p|4k|1080p|1080i|720p|480p)/i);
  let quality = qualityMatch ? qualityMatch[1].toLowerCase() : 'unknown';
  if (quality === '4k') quality = '2160p';

  const codecMatch = title.match(/(x[\.\s-]?265|h[\.\s-]?265|hevc|x[\.\s-]?264|h[\.\s-]?264|avc|av1|xvid|divx)/i);
  let codec = codecMatch ? codecMatch[1].toLowerCase().replace(/[\.\s-]/g, '') : 'unknown';

  if (['x265', 'h265', 'hevc'].includes(codec)) codec = 'HEVC';
  else if (['x264', 'h264', 'avc'].includes(codec)) codec = 'H.264';
  else if (codec === 'av1') codec = 'AV1';
  else if (codec !== 'unknown') codec = codec.toUpperCase();

  const sourceMatch = title.match(/(blu-?ray|bdsr|remux|web-?dl|web-?rip|video|hdrip|brrip|bmdrip|bdrip|dvdrip|cam|ts|telesync)/i);
  let source = sourceMatch ? sourceMatch[1].toLowerCase().replace('-', '') : 'unknown';

  if (['bluray', 'bdsr', 'brrip', 'bdrip', 'bmdrip'].includes(source)) source = 'Blu-Ray';
  else if (source === 'webdl') source = 'WEB-DL';
  else if (source === 'webrip') source = 'WEBRip';
  else if (source === 'remux') source = 'Remux';
  else if (source !== 'unknown') source = source.toUpperCase();

  return { quality, codec, source };
}
