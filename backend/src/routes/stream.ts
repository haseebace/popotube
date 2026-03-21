import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';

export default async function (fastify: FastifyInstance) {
  fastify.get('/api/stream/:videoId', async (request: FastifyRequest<{ Params: { videoId: string } }>, reply: FastifyReply) => {
    try {
      const { videoId } = request.params;
      
      const { data, error } = await supabase
        .from('videos')
        .select('playback_source')
        .eq('id', videoId)
        .single();
        
      if (error || !data || !data.playback_source) {
        return reply.code(404).send({ error: 'Video stream not found' });
      }

      const streamUrl = (data.playback_source as any).url;
      if (!streamUrl) {
        return reply.code(404).send({ error: 'Stream URL not available' });
      }

      fastify.log.info(`🔃 [Proxy] Passing through stream request for video ${videoId}`);

      // Forward request transparently while scrubbing the content-disposition
      // header from Real-Debrid so the browser's native video player handles it in-line
      return reply.from(streamUrl, {
        rewriteRequestHeaders: (request, headers) => {
            return headers;
        },
        rewriteHeaders: (headers, request) => {
            const newHeaders = { ...headers };
            delete newHeaders['content-disposition'];
            return newHeaders;
        }
      });
    } catch (err) {
      fastify.log.error({ err }, 'Error in stream proxy');
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
}
