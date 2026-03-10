import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';
import { ingestionQueue } from '../queue/ingestion';

interface CancelJobBody {
  videoId: string;
}

export default async function (fastify: FastifyInstance) {
  fastify.post('/api/cancel-job', async (request: FastifyRequest<{ Body: CancelJobBody }>, reply: FastifyReply) => {
    try {
      const { videoId } = request.body;

      if (!videoId) {
        return reply.status(400).send({ error: 'videoId is required' });
      }

      // 1. Delete from Supabase Database so it vanishes from UI
      await supabase.from('videos').delete().eq('id', videoId);
      
      // The worker will fail to update progress or fetch this record in future steps
      // and will gracefully stop itself. We leave Real-Debrid cleanup to the worker's catch block.
      fastify.log.info(`Deleted video record ${videoId} from DB.`);

      return reply.send({ success: true });
    } catch (err) {
      fastify.log.error({ err }, 'Error in cancel-job route');
      return reply.status(500).send({ error: 'Internal server error executing cancel' });
    }
  });
}
