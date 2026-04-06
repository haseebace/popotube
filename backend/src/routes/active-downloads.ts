import { FastifyInstance, FastifyReply } from "fastify";
import { supabase } from "../lib/supabase";

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/api/admin/active-downloads",
    async (_request, reply: FastifyReply) => {
      const { data, error } = await supabase
        .from("videos")
        .select(
          "id, title, info_hash, status, error_message, created_at, updated_at, progress",
        )
        .neq("status", "completed")
        .neq("status", "failed")
        .order("created_at", { ascending: false });

      if (error) {
        return reply.status(500).send({ error: error.message });
      }
      return reply.send({ downloads: data ?? [] });
    },
  );
}
