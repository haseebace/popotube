import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';

export default async function (fastify: FastifyInstance) {
  fastify.get('/api/movie-status', async (request: FastifyRequest<{ Querystring: { tmdb_id?: string } }>, reply: FastifyReply) => {
    try {
      const tmdbId = request.query.tmdb_id;

      if (!tmdbId) {
        return reply.status(400).send({ error: 'tmdb_id is required' });
      }

      const { data, error } = await supabase
        .from('videos')
        .select('id, status, stream_url, playback_source, progress, title, error_message, quality, codec, source')
        .eq('tmdb_id', parseInt(tmdbId, 10))
        .maybeSingle();

      if (error) {
        fastify.log.error({ err: error }, 'Supabase error checking movie status');
        return reply.status(500).send({ error: 'Database error' });
      }

      if (!data) {
        return reply.send({ exists: false });
      }

      return reply.send({ exists: true, video: data });
    } catch (err: any) {
      fastify.log.error({ err }, 'Error checking movie status');
      return reply.status(500).send({ error: err.message });
    }
  });
}
