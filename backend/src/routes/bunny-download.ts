import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';
import { ingestionQueue } from '../queue/ingestion';
import { hasEnoughDiskSpace } from '../lib/disk-space';

interface BunnyDownloadBody {
  magnet: string;
  size: number;
  title: string;
}

export default async function (fastify: FastifyInstance) {
  fastify.post('/api/bunny-download', async (request: FastifyRequest<{ Body: BunnyDownloadBody }>, reply: FastifyReply) => {
    try {
      const { magnet, size, title } = request.body;

      if (!magnet || !size || !title) {
        return reply.status(400).send({ error: 'Missing required fields: magnet, size, title' });
      }

      // Extract info_hash
      const match = magnet.match(/urn:btih:([a-zA-Z0-9]+)/i);
      const info_hash = match ? match[1].toLowerCase() : null;

      if (!info_hash) {
        return reply.status(400).send({ error: 'Invalid magnet link' });
      }

      // Check Disk Space BEFORE proceeding
      const { hasSpace, message } = await hasEnoughDiskSpace(size);
      if (!hasSpace) {
        return reply.status(507).send({ error: `Not enough disk space on server. ${message}` });
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

          return reply.send({
            message: 'Video already exists',
            status: existingData.status,
            videoId: existingData.id,
            jobId: null,
          });
        }

        fastify.log.error({ err: error }, 'Database insert error');
        return reply.status(500).send({ error: 'Database error' });
      }

      videoRecord = data;

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
