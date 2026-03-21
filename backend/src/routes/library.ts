import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rdClient } from '../lib/real-debrid';

export default async function (fastify: FastifyInstance) {
  fastify.get('/api/library', async (request: FastifyRequest<{ Querystring: { page?: string, limit?: string } }>, reply: FastifyReply) => {
    try {
      const page = request.query.page ? parseInt(request.query.page, 10) : 1;
      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50;

      const { data: torrentData, total } = await rdClient.getTorrents(page, limit);
      return reply.send({ success: true, torrents: torrentData, total });
    } catch (err: any) {
      fastify.log.error({ err }, 'Error fetching library from Real-Debrid');
      return reply.status(500).send({ error: err.message || 'Internal server error fetching library' });
    }
  });

  fastify.delete('/api/library/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      if (!id) return reply.status(400).send({ error: 'Missing torrent ID' });
      
      await rdClient.deleteTorrent(id);
      return reply.send({ success: true, message: `Torrent ${id} deleted successfully` });
    } catch (err: any) {
      fastify.log.error({ err }, `Error deleting torrent ${request.params.id}`);
      return reply.status(500).send({ error: err.message || 'Internal server error deleting torrent' });
    }
  });

  fastify.get('/api/library/:id/stream', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      if (!id) return reply.status(400).send({ error: 'Missing torrent ID' });
      
      const info = await rdClient.getTorrentInfo(id);
      if (!info || !info.links || info.links.length === 0) {
        return reply.status(404).send({ error: 'No playable links found on this torrent container' });
      }

      const streamableLink = info.links[0]; // grab the primary file link
      const unrestricted = await rdClient.unrestrictLink(streamableLink);
      
      return reply.send({ success: true, stream_url: unrestricted.download });
    } catch (err: any) {
      fastify.log.error({ err }, `Error fetching stream link for torrent ${request.params.id}`);
      return reply.status(500).send({ error: 'Failed to unrestrict the streaming media file' });
    }
  });
}
