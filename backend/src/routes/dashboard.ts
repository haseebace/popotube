import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { rdClient } from '../lib/real-debrid';
import { ingestionQueue } from '../queue/ingestion';
import { supabase } from '../lib/supabase';

export default async function (fastify: FastifyInstance) {
  fastify.get('/api/dashboard/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Fetch all data sources in parallel for maximum speed
      const [
        rdUser,
        queueJobCounts,
        activeJobs,
        completedJobs,
        rdTorrents,
      ] = await Promise.allSettled([
        rdClient.getUser(),
        ingestionQueue.getJobCounts(),
        ingestionQueue.getActive(),
        ingestionQueue.getCompleted(0, 5),
        rdClient.getTorrents(1, 10),
      ]);

      // Safely unwrap PromiseSettledResult values
      const user       = rdUser.status === 'fulfilled' ? rdUser.value : null;
      const counts     = queueJobCounts.status === 'fulfilled' ? queueJobCounts.value : null;
      const active     = activeJobs.status === 'fulfilled' ? activeJobs.value : [];
      const completed  = completedJobs.status === 'fulfilled' ? completedJobs.value : [];
      const torrentsData = rdTorrents.status === 'fulfilled' ? rdTorrents.value : { data: [], total: 0 };

      // Build the active feed rows from queue jobs
      const activeQueue = active.map((job) => ({
        id: job.id,
        name: job.data?.torrentName || job.data?.name || `Job #${job.id}`,
        status: 'active',
        progress: typeof job.progress === 'number' ? job.progress : 0,
        quality: job.data?.quality || null,
      }));

      // Last 5 recently completed jobs
      const recentlyCompleted = completed.map((job) => ({
        id: job.id,
        name: job.data?.torrentName || job.data?.name || `Job #${job.id}`,
        status: 'completed',
        progress: 100,
        quality: job.data?.quality || null,
      }));

      return reply.send({
        success: true,
        data: {
          rdUser: user ? {
            username: user.username,
            type: user.type,
            expiration: user.expiration,
            points: user.points,
          } : null,
          queue: {
            active:    counts?.active    ?? 0,
            waiting:   counts?.waiting   ?? 0,
            completed: counts?.completed ?? 0,
            failed:    counts?.failed    ?? 0,
          },
          library: {
            total: (torrentsData as any).total ?? 0,
          },
          feed: [
            ...activeQueue,
            ...recentlyCompleted,
          ],
        }
      });
    } catch (err: any) {
      fastify.log.error({ err }, 'Error fetching dashboard stats');
      return reply.status(500).send({ error: err.message || 'Dashboard stats fetch failed' });
    }
  });
}
