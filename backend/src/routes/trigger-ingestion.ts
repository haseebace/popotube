import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { ingestionQueue } from '../queue/ingestion';
import { parseTorrentMetadata } from '../lib/torrent-parser';
import { findBestVideoForTmdb, isReusableVideoStatus } from '../lib/video-reuse';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TORRENTIO_BASE_URL = 'https://torrentio.strem.fun';

interface TriggerIngestionBody {
  tmdb_id: number;
  title: string;
  year?: string;
}

interface TorrentioCandidate {
  title: string;
  sizeBytes: number;
  seeders: number;
  magnetUri: string | null;
  infoHash: string | null;
  source: string;
  quality: string;
  codec: string;
  releaseSource: string;
  details: string;
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function scoreTorrentResult(
  result: TorrentioCandidate,
  requestedTitle: string,
  requestedYear?: string
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const normalizedRequestedTitle = normalizeTitle(requestedTitle);
  const normalizedResultTitle = normalizeTitle(result.title || '');
  const seeders = Number(result.seeders || 0);
  const sizeGB = Number(result.sizeBytes || 0) / (1024 * 1024 * 1024);
  const metadata = {
    quality: result.quality,
    codec: result.codec,
    source: result.releaseSource,
  };
  let score = seeders / Math.max(sizeGB, 0.25);

  if (normalizedResultTitle.includes(normalizedRequestedTitle)) {
    score += 120;
    reasons.push('title_match');
  } else {
    score -= 120;
    reasons.push('title_mismatch');
  }

  if (requestedYear) {
    const yearRegex = new RegExp(`\\b${requestedYear}\\b`);
    if (yearRegex.test(result.title || '')) {
      score += 40;
      reasons.push('year_match');
    } else {
      score -= 80;
      reasons.push('year_missing');
    }
  }

  if (metadata.quality === '2160p') {
    score -= 40;
    reasons.push('penalize_4k');
  } else if (metadata.quality === '1080p' || metadata.quality === '1080i') {
    score += 60;
    reasons.push('prefer_1080p');
  } else {
    score -= 500;
    reasons.push('below_1080p');
  }

  if (metadata.source === 'Remux') {
    score -= 15;
    reasons.push('slight_remux_penalty');
  }

  if (metadata.source === 'WEB-DL') {
    score += 40;
    reasons.push('prefer_webdl');
  } else if (metadata.source === 'Blu-Ray') {
    score += 25;
    reasons.push('prefer_bluray');
  }

  if (metadata.codec === 'HEVC' || metadata.codec === 'AV1') {
    score += 12;
    reasons.push('efficient_codec');
  }

  if (metadata.source === 'CAM' || metadata.source === 'TS' || /\b(hdcam|hd-ts|telecine)\b/i.test(result.title || '')) {
    score -= 400;
    reasons.push('reject_cam_quality');
  }

  if (/sample/i.test(result.title || '')) {
    score -= 300;
    reasons.push('sample_penalty');
  }

  if (sizeGB > 0 && sizeGB < 0.6) {
    score -= 150;
    reasons.push('too_small');
  } else if (sizeGB > 25) {
    score -= 80;
    reasons.push('too_large');
  }

  if (seeders <= 0) {
    score -= 200;
    reasons.push('no_seeders');
  } else if (seeders >= 25) {
    score += 25;
    reasons.push('healthy_seeders');
  }

  return {
    score: Number(score.toFixed(2)),
    reasons,
  };
}

function parseSizeToBytes(sizeStr: string): number {
  const match = sizeStr.match(/([0-9.]+)\s*(GB|MB|KB|B)/i);
  if (!match) return 0;

  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  switch (unit) {
    case 'GB':
      return Math.floor(val * 1024 * 1024 * 1024);
    case 'MB':
      return Math.floor(val * 1024 * 1024);
    case 'KB':
      return Math.floor(val * 1024);
    default:
      return Math.floor(val);
  }
}

async function resolveImdbIdFromTmdb(tmdbId: number): Promise<string | null> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not configured on the backend.');
  }

  const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/external_ids`, {
    params: {
      api_key: TMDB_API_KEY,
    },
    timeout: 10000,
  });

  return response.data?.imdb_id || null;
}

async function fetchTorrentioCandidates(imdbId: string): Promise<TorrentioCandidate[]> {
  const torrentioUrl = `${TORRENTIO_BASE_URL}/providers=yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrent9,horriblesubs,nyaasi,tokyotosho,sukebei/stream/movie/${imdbId}.json`;
  const response = await axios.get(torrentioUrl, { timeout: 15000 });
  const streams = response.data?.streams || [];

  return streams.map((stream: any) => {
    const parts = String(stream.title || '').split('\n');
    const candidateTitle = parts[0] || stream.name || '';
    const infoLine = parts[1] || '';
    const sizeMatch = infoLine.match(/(?:💾|size:)?\s*([0-9.]+\s*(GB|MB|KB|B))/i);
    const seederMatch = infoLine.match(/(?:👤|S:)\s*([0-9]+)/i);
    const sizeStr = sizeMatch ? sizeMatch[1].trim() : '0 B';
    const metadata = parseTorrentMetadata(candidateTitle);

    return {
      title: candidateTitle,
      sizeBytes: parseSizeToBytes(sizeStr),
      seeders: seederMatch ? parseInt(seederMatch[1], 10) : 0,
      magnetUri: stream.infoHash ? `magnet:?xt=urn:btih:${stream.infoHash}` : null,
      infoHash: stream.infoHash || null,
      source: stream.name || 'torrentio',
      quality: metadata.quality,
      codec: metadata.codec,
      releaseSource: metadata.source,
      details: infoLine,
    };
  });
}

export default async function (fastify: FastifyInstance) {
  fastify.post('/api/trigger-ingestion', async (request: FastifyRequest<{ Body: TriggerIngestionBody }>, reply: FastifyReply) => {
    const startedAt = Date.now();
    try {
      const { tmdb_id, title, year } = request.body;

      if (!tmdb_id || !title) {
        return reply.status(400).send({ error: 'tmdb_id and title are required' });
      }

      const existingVideo = await findBestVideoForTmdb(tmdb_id);
      if (existingVideo && isReusableVideoStatus(existingVideo.status)) {
        fastify.log.info({
          tmdb_id,
          existing_video_id: existingVideo.id,
          existing_status: existingVideo.status,
        }, 'Reusing existing TMDB video before Torrentio search');

        return reply.send({
          message: existingVideo.status === 'completed' ? 'Video already available' : 'Video already in progress',
          status: existingVideo.status,
          videoId: existingVideo.id,
          jobId: existingVideo.bullmq_job_id || null,
          reusedExisting: true,
          stream_url: existingVideo.stream_url || null,
          playback_source: existingVideo.playback_source || null,
        });
      }

      if (!TMDB_API_KEY) {
        return reply.status(500).send({ error: 'TMDB API key not configured.' });
      }

      fastify.log.info({ tmdb_id, title }, 'Starting Torrentio search for ingestion');

      const imdbLookupStartedAt = Date.now();
      const imdbId = await resolveImdbIdFromTmdb(tmdb_id);
      fastify.log.info({
        tmdb_id,
        title,
        duration_ms: Date.now() - imdbLookupStartedAt,
        imdb_id: imdbId,
      }, 'TMDB external ID lookup completed');

      if (!imdbId) {
        return reply.status(404).send({ error: 'Unable to resolve IMDB ID for this movie.' });
      }

      const torrentioStartedAt = Date.now();
      const candidates = await fetchTorrentioCandidates(imdbId);
      fastify.log.info({
        tmdb_id,
        imdb_id: imdbId,
        duration_ms: Date.now() - torrentioStartedAt,
        result_count: candidates.length,
      }, 'Torrentio search completed');

      const validResults = candidates.filter((candidate) =>
        candidate.magnetUri &&
        candidate.infoHash &&
        (candidate.quality === '1080p' || candidate.quality === '1080i' || candidate.quality === '2160p')
      );

      if (validResults.length === 0) {
        return reply.status(404).send({ error: 'No 1080p-or-higher Torrentio streams were found for this movie' });
      }

      // 2. Rank torrents with title, year, quality, source, codec, size, and seeder signals.
      const scoredResults = validResults.map((candidate) => {
        const { score, reasons } = scoreTorrentResult(candidate, title, year);
        const r = candidate;
        return { ...r, score, scoreReasons: reasons };
      });

      const bestResult = scoredResults.sort((a: any, b: any) => b.score - a.score)[0];
      const metadata = parseTorrentMetadata(bestResult.title);

      const magnet = bestResult.magnetUri;
      const size = bestResult.sizeBytes;
      
      // Extract info_hash
      const match = magnet?.match(/urn:btih:([a-zA-Z0-9]+)/i);
      const info_hash = match ? match[1].toLowerCase() : null;

      if (!info_hash) {
        return reply.status(400).send({ error: 'Invalid magnet link extracted from Torrentio' });
      }

      const existingVideoAfterSearch = await findBestVideoForTmdb(tmdb_id);
      if (existingVideoAfterSearch && isReusableVideoStatus(existingVideoAfterSearch.status)) {
        fastify.log.info({
          tmdb_id,
          existing_video_id: existingVideoAfterSearch.id,
          existing_status: existingVideoAfterSearch.status,
        }, 'Reusing existing TMDB video after Torrentio search');

        return reply.send({
          message: existingVideoAfterSearch.status === 'completed' ? 'Video already available' : 'Video already in progress',
          status: existingVideoAfterSearch.status,
          videoId: existingVideoAfterSearch.id,
          jobId: existingVideoAfterSearch.bullmq_job_id || null,
          reusedExisting: true,
          stream_url: existingVideoAfterSearch.stream_url || null,
          playback_source: existingVideoAfterSearch.playback_source || null,
        });
      }

      fastify.log.info({
        info_hash,
        title,
        selected_title: bestResult.title,
        selected_seeders: bestResult.seeders,
        selected_size: bestResult.sizeBytes,
        selected_quality: bestResult.quality,
        selected_source: bestResult.source,
        selected_score: bestResult.score,
        selected_score_reasons: bestResult.scoreReasons,
        top_candidates: scoredResults
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 5)
          .map((result: any) => ({
            title: result.title,
            seeders: result.seeders,
            size: result.sizeBytes,
            quality: result.quality,
            score: result.score,
            reasons: result.scoreReasons,
          })),
      }, 'Found best Torrentio candidate, inserting to database');

      // 3. Insert or update DB
      let videoRecord;
      const { data, error } = await supabase
        .from('videos')
        .insert({
          info_hash,
          title,
          magnet_uri: magnet,
          size_bytes: size,
          tmdb_id,
          quality: metadata.quality !== 'unknown' ? metadata.quality : null,
          codec: metadata.codec !== 'unknown' ? metadata.codec : null,
          source: metadata.source !== 'unknown' ? metadata.source : null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // PostgreSQL unique_violation
          const duplicateStartedAt = Date.now();
          const { data: existingData, error: fetchError } = await supabase
            .from('videos')
            .select('*')
            .eq('info_hash', info_hash)
            .single();

          fastify.log.info({
            tmdb_id,
            info_hash,
            duration_ms: Date.now() - duplicateStartedAt,
          }, 'Resolved duplicate video lookup');

          if (fetchError || !existingData) {
            fastify.log.error({ err: fetchError }, 'Error fetching existing record');
            return reply.status(500).send({ error: 'Internal server error resolving duplicate' });
          }

          if (existingData.status === 'failed' || existingData.status === 'retrying') {
             const { data: updatedData, error: updateError } = await supabase
               .from('videos')
               .update({
                 status: 'pending',
                 error_message: null,
                 progress: 0,
                 tmdb_id: tmdb_id || existingData.tmdb_id,
                 quality: metadata.quality !== 'unknown' ? metadata.quality : existingData.quality,
                 codec: metadata.codec !== 'unknown' ? metadata.codec : existingData.codec,
                 source: metadata.source !== 'unknown' ? metadata.source : existingData.source,
               })
               .eq('id', existingData.id)
               .select()
               .single();
               
             if (updateError || !updatedData) {
                return reply.status(500).send({ error: 'Internal error updating failed video record' });
             }
             videoRecord = updatedData;
          } else {
             if (tmdb_id && !existingData.tmdb_id) {
                await supabase.from('videos').update({ 
                  tmdb_id,
                  quality: metadata.quality !== 'unknown' ? metadata.quality : existingData.quality,
                  codec: metadata.codec !== 'unknown' ? metadata.codec : existingData.codec,
                  source: metadata.source !== 'unknown' ? metadata.source : existingData.source
                }).eq('id', existingData.id);
             }

             fastify.log.info({
               tmdb_id,
               info_hash,
               videoId: existingData.id,
               status: existingData.status,
               total_duration_ms: Date.now() - startedAt,
             }, 'Trigger ingestion resolved to existing video');

             return reply.send({
               message: 'Video already exists',
               status: existingData.status,
               videoId: existingData.id,
               jobId: existingData.bullmq_job_id || null,
             });
          }
        } else {
          fastify.log.error({ err: error }, 'Database insert error');
          return reply.status(500).send({ error: 'Database error' });
        }
      } else {
        videoRecord = data;
      }

      // 4. Queue the job
      fastify.log.info({ videoId: videoRecord.id }, 'Queueing ingestion job');
      const queueStartedAt = Date.now();
      const job = await ingestionQueue.add('download', {
        videoId: videoRecord.id,
        magnet_uri: videoRecord.magnet_uri,
      }, {
        jobId: videoRecord.id,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      });

      fastify.log.info({
        tmdb_id,
        info_hash,
        videoId: videoRecord.id,
        jobId: job.id,
        queue_duration_ms: Date.now() - queueStartedAt,
        total_duration_ms: Date.now() - startedAt,
      }, 'Trigger ingestion queued successfully');

      await supabase.from('videos').update({ bullmq_job_id: job.id }).eq('id', videoRecord.id);

      return reply.send({
        success: true,
        message: 'Ingestion triggered successfully',
        status: videoRecord.status,
        videoId: videoRecord.id,
        jobId: job.id,
      });

    } catch (err: any) {
      if (err.code === 'ECONNABORTED' || err.name === 'TimeoutError') {
        fastify.log.error('Torrentio/TMDB request timed out');
        return reply.status(504).send({ error: 'Torrentio/TMDB request timed out' });
      }
      fastify.log.error({ err }, 'Exception in trigger-ingestion route');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
