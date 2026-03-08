import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';
import { ingestionQueue } from '../queue/ingestion';
import { qBittorrentClient } from '../lib/qbittorrent';

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

      // Fetch the video from Supabase to get the info_hash and verify it exists
      const { data: videoRecord, error: fetchErr } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();
        
      if (fetchErr || !videoRecord) {
        return reply.status(404).send({ error: 'Video not found' });
      }

      // 1. Delete from Supabase Database so it vanishes from UI
      await supabase.from('videos').delete().eq('id', videoId);
      
      // 2. Remove job from qBittorrent. 
      // The worker's own polling loop will detect that the torrent is missing
      // and will throw an UnrecoverableError and stop itself gracefully.
      if (videoRecord.info_hash) {
        try {
          await qBittorrentClient.deleteTorrent(videoRecord.info_hash, true);
          fastify.log.info(`Cleaned up torrent ${videoRecord.info_hash} from qBittorrent`);
        } catch (e) {
          fastify.log.error({ err: e }, 'qBittorrent cleanup failed during cancel');
        }
      }

      return reply.send({ success: true });
    } catch (err) {
      fastify.log.error({ err }, 'Error in cancel-job route');
      return reply.status(500).send({ error: 'Internal server error executing cancel' });
    }
  });
}
