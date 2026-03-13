import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';
import { ingestionQueue } from '../queue/ingestion';

interface BunnyDownloadBody {
  magnet: string;
  size: number;
  title: string;
  tmdb_id?: number;
  quality?: string;
  codec?: string;
  source?: string;
}

export default async function (fastify: FastifyInstance) {
  fastify.post('/api/bunny-download', async (request: FastifyRequest<{ Body: BunnyDownloadBody }>, reply: FastifyReply) => {
    try {
      const { magnet, size, title, tmdb_id, quality, codec, source } = request.body;

      if (!magnet || !size || !title) {
        return reply.status(400).send({ error: 'Missing required fields: magnet, size, title' });
      }

      // Extract info_hash
      const match = magnet.match(/urn:btih:([a-zA-Z0-9]+)/i);
      const info_hash = match ? match[1].toLowerCase() : null;

      if (!info_hash) {
        return reply.status(400).send({ error: 'Invalid magnet link' });
      }

      // Try to insert
      let videoRecord;
      const { data, error } = await supabase
        .from('videos')
        .insert({
          info_hash,
          title,
          magnet_uri: magnet,
          size_bytes: size,
          tmdb_id: tmdb_id || null, // store the tmdb_id if provided
          quality: quality || null,
          codec: codec || null,
          source: source || null,
        })
        .select()
        .single();

      if (error) {
        // 23505 is PostgreSQL's unique_violation error code
        if (error.code === '23505') {
          // Fetch existing record
          const { data: existingData, error: fetchError } = await supabase
            .from('videos')
            .select('*')
            .eq('info_hash', info_hash)
            .single();

          if (fetchError || !existingData) {
            fastify.log.error({ err: fetchError }, 'Error fetching existing record');
            return reply.status(500).send({ error: 'Internal server error resolving duplicate' });
          }

          if (existingData.status === 'failed' || existingData.status === 'retrying') {
             // Reset status down to pending, clear errors, and continue to queue
             const { data: updatedData, error: updateError } = await supabase
               .from('videos')
               .update({
                 status: 'pending',
                 error_message: null,
                 progress: 0,
                 tmdb_id: tmdb_id || existingData.tmdb_id, // ensure tmdb_id is attached if supplied
                 quality: quality || existingData.quality,
                 codec: codec || existingData.codec,
                 source: source || existingData.source,
               })
               .eq('id', existingData.id)
               .select()
               .single();
               
             if (updateError || !updatedData) {
                return reply.status(500).send({ error: 'Internal error updating failed video record' });
             }
             videoRecord = updatedData;
          } else {
             // Just implicitly update the DB record if it was missing the tmdb_id
             if (tmdb_id && !existingData.tmdb_id) {
                await supabase.from('videos').update({ 
                  tmdb_id,
                  quality: quality || existingData.quality,
                  codec: codec || existingData.codec,
                  source: source || existingData.source
                }).eq('id', existingData.id);
             }

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

      // Queue the job with resilience settings
      const job = await ingestionQueue.add('download', {
        videoId: videoRecord.id,
        magnet_uri: videoRecord.magnet_uri,
      }, {
        jobId: videoRecord.id,
        attempts: 3,  // Retries up to 3 times
        backoff: {
          type: 'exponential',
          delay: 5000 // 5s, 10s, 20s...
        }
      });

      // Save the BullMQ job ID back to Supabase for reliable cancellation later
      await supabase.from('videos').update({ bullmq_job_id: job.id }).eq('id', videoRecord.id);

      return reply.send({
        message: 'Video submitted successfully',
        status: videoRecord.status,
        videoId: videoRecord.id,
        jobId: job.id,
      });

    } catch (err) {
      fastify.log.error({ err }, 'Exception in bunny-download route');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
