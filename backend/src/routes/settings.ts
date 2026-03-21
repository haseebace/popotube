import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rdClient } from '../lib/real-debrid';

import { supabase } from '../lib/supabase';

export default async function (fastify: FastifyInstance) {
  fastify.get('/api/settings/real-debrid/user', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await rdClient.getUser();
      return reply.send({ success: true, user });
    } catch (err: any) {
      fastify.log.error({ err }, 'Error fetching Real-Debrid user details');
      return reply.status(500).send({ error: err.message || 'Internal server error' });
    }
  });

  fastify.get('/api/settings/configs/:key', async (request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) => {
    const { key } = request.params;
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
    
    if (error) return reply.status(500).send({ error: error.message });
    return reply.send({ success: true, value: data?.value || null });
  });

  fastify.post('/api/settings/configs', async (request: FastifyRequest<{ Body: { key: string; value: string } }>, reply: FastifyReply) => {
    const { key, value } = request.body;
    
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      
    if (error) {
      fastify.log.error({ error }, 'Supabase app_settings upsert error');
      return reply.status(500).send({ error: error.message });
    }
    
    return reply.send({ success: true });
  });
}
