import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rdClient } from '../lib/real-debrid';

export default async function (fastify: FastifyInstance) {
  fastify.get('/api/downloads', async (request: FastifyRequest<{ Querystring: { page?: string, limit?: string } }>, reply: FastifyReply) => {
    try {
      const page = request.query.page ? parseInt(request.query.page, 10) : 1;
      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 100;

      const { data: downloadData, total } = await rdClient.getDownloads(page, limit);
      return reply.send({ success: true, downloads: downloadData, total });
    } catch (err: any) {
      fastify.log.error({ err }, 'Error fetching downloads from Real-Debrid');
      return reply.status(500).send({ error: err.message || 'Internal server error fetching downloads' });
    }
  });

  fastify.delete('/api/downloads/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      if (!id) return reply.status(400).send({ error: 'Missing download ID' });
      
      await rdClient.deleteDownload(id);
      return reply.send({ success: true, message: `Download link ${id} deleted successfully` });
    } catch (err: any) {
      fastify.log.error({ err }, `Error deleting download ${request.params.id}`);
      return reply.status(500).send({ error: err.message || 'Internal server error deleting download' });
    }
  });
}
