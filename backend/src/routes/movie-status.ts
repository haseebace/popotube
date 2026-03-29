import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { findBestVideoForTmdb } from '../lib/video-reuse';

export default async function (fastify: FastifyInstance) {
  fastify.get('/api/movie-status', async (request: FastifyRequest<{ Querystring: { tmdb_id?: string } }>, reply: FastifyReply) => {
    try {
      const tmdbId = request.query.tmdb_id;

      if (!tmdbId) {
        return reply.status(400).send({ error: 'tmdb_id is required' });
      }

      const data = await findBestVideoForTmdb(
        parseInt(tmdbId, 10),
        'id, status, stream_url, playback_source, progress, title, error_message, quality, codec, source, tmdb_id, bullmq_job_id, season_number, episode_number, release_year, release_group, release_parse_extras'
      );

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
