import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { ingestionQueue } from '../queue/ingestion';
import { parseTorrentMetadata } from '../lib/torrent-parser';

const JACKETT_URL = process.env.JACKETT_URL || 'http://jackett:9117';
const JACKETT_API_KEY = process.env.JACKETT_API_KEY;

interface TriggerIngestionBody {
  tmdb_id: number;
  title: string;
  year?: string;
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function scoreTorrentResult(
  result: any,
  requestedTitle: string,
  requestedYear?: string
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const normalizedRequestedTitle = normalizeTitle(requestedTitle);
  const normalizedResultTitle = normalizeTitle(result.Title || '');
  const seeders = Number(result.Seeders || 0);
  const sizeGB = Number(result.Size || 0) / (1024 * 1024 * 1024);
  const metadata = parseTorrentMetadata(result.Title || '');
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
    if (yearRegex.test(result.Title || '')) {
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
  } else if (metadata.quality === '720p') {
    score += 20;
    reasons.push('accept_720p');
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

  if (metadata.source === 'CAM' || metadata.source === 'TS' || /\b(hdcam|hd-ts|telecine)\b/i.test(result.Title || '')) {
    score -= 400;
    reasons.push('reject_cam_quality');
  }

  if (/sample/i.test(result.Title || '')) {
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

export default async function (fastify: FastifyInstance) {
  fastify.post('/api/trigger-ingestion', async (request: FastifyRequest<{ Body: TriggerIngestionBody }>, reply: FastifyReply) => {
    const startedAt = Date.now();
    try {
      const { tmdb_id, title, year } = request.body;

      if (!tmdb_id || !title) {
        return reply.status(400).send({ error: 'tmdb_id and title are required' });
      }

      if (!JACKETT_API_KEY || JACKETT_API_KEY === 'your_api_key_here') {
        return reply.status(500).send({ error: 'Jackett API key not configured.' });
      }

      fastify.log.info({ tmdb_id, title }, 'Starting Jackett search for ingestion');

      // 1. Search Jackett for the movie
      const query = `${title} ${year || ''}`.trim();
      const jackettEndpoint = `${JACKETT_URL}/api/v2.0/indexers/all/results?apikey=${JACKETT_API_KEY}&Query=${encodeURIComponent(query)}&_=${Date.now()}`;
      
      const jackettStartedAt = Date.now();
      const searchRes = await axios.get(jackettEndpoint, { timeout: 15000 });
      fastify.log.info({
        tmdb_id,
        title,
        query,
        duration_ms: Date.now() - jackettStartedAt,
      }, 'Jackett search completed');
      const results = searchRes.data.Results || [];

      // Filter results to those that have a magnetUri
      const validResults = results.filter((r: any) => r.MagnetUri);

      if (validResults.length === 0) {
        return reply.status(404).send({ error: 'No magnet links found for this movie' });
      }

      // 2. Rank torrents with title, year, quality, source, codec, size, and seeder signals.
      const scoredResults = validResults.map((r: any) => {
        const { score, reasons } = scoreTorrentResult(r, title, year);
        return { ...r, score, scoreReasons: reasons };
      });

      const bestResult = scoredResults.sort((a: any, b: any) => b.score - a.score)[0];
      const metadata = parseTorrentMetadata(bestResult.Title);

      const magnet = bestResult.MagnetUri;
      const size = bestResult.Size;
      
      // Extract info_hash
      const match = magnet.match(/urn:btih:([a-zA-Z0-9]+)/i);
      const info_hash = match ? match[1].toLowerCase() : null;

      if (!info_hash) {
        return reply.status(400).send({ error: 'Invalid magnet link extracted from Jackett' });
      }

      fastify.log.info({
        info_hash,
        title,
        selected_title: bestResult.Title,
        selected_seeders: bestResult.Seeders,
        selected_size: bestResult.Size,
        selected_score: bestResult.score,
        selected_score_reasons: bestResult.scoreReasons,
        top_candidates: scoredResults
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 5)
          .map((result: any) => ({
            title: result.Title,
            seeders: result.Seeders,
            size: result.Size,
            score: result.score,
            reasons: result.scoreReasons,
          })),
      }, 'Found best torrent, inserting to database');

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
        fastify.log.error('Jackett request timed out');
        return reply.status(504).send({ error: 'Jackett request timed out' });
      }
      fastify.log.error({ err }, 'Exception in trigger-ingestion route');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
