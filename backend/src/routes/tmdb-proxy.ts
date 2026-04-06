import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL =
  process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

function tmdbKeyMissing(reply: FastifyReply) {
  return reply.status(500).send({ error: "TMDb API key is not configured." });
}

function sortByTrendingPriority(
  items: Array<{ id: number }>,
  trendingIds: number[],
) {
  if (trendingIds.length === 0) return items;
  const rank = new Map<number, number>();
  trendingIds.forEach((id, idx) => rank.set(id, idx));
  return [...items].sort((a, b) => {
    const ra = rank.get(a.id);
    const rb = rank.get(b.id);
    if (typeof ra === "number" && typeof rb === "number") return ra - rb;
    if (typeof ra === "number") return -1;
    if (typeof rb === "number") return 1;
    return 0;
  });
}

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/api/tmdb/trending",
    async (
      request: FastifyRequest<{
        Querystring: { time_window?: string; page?: string };
      }>,
      reply: FastifyReply,
    ) => {
      if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key_here") {
        return tmdbKeyMissing(reply);
      }
      try {
        const timeWindow = request.query.time_window || "day";
        const page = request.query.page || "1";
        const response = await fetch(
          `${TMDB_BASE_URL}/trending/movie/${timeWindow}?language=en-US&page=${page}&api_key=${TMDB_API_KEY}`,
        );
        if (!response.ok) {
          throw new Error(`TMDb API error: ${response.statusText}`);
        }
        const data = await response.json();
        return reply.send(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Internal server error";
        return reply.status(500).send({ error: message });
      }
    },
  );

  fastify.get(
    "/api/tmdb/search",
    async (
      request: FastifyRequest<{
        Querystring: { query?: string; page?: string };
      }>,
      reply: FastifyReply,
    ) => {
      if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key_here") {
        return tmdbKeyMissing(reply);
      }
      try {
        const query = request.query.query;
        const page = request.query.page || "1";
        if (!query) {
          return reply.status(400).send({ error: "Search query is required." });
        }
        const response = await fetch(
          `${TMDB_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=${page}&api_key=${TMDB_API_KEY}`,
        );
        if (!response.ok) {
          throw new Error(`TMDb API error: ${response.statusText}`);
        }
        const data = (await response.json()) as {
          results?: Array<{ media_type?: string }>;
        };
        const results = (data.results ?? []).filter(
          (r) => r.media_type === "movie" || r.media_type === "tv",
        );
        return reply.send({ ...data, results });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Internal server error";
        return reply.status(500).send({ error: message });
      }
    },
  );

  fastify.get(
    "/api/tmdb/discover",
    async (
      request: FastifyRequest<{
        Querystring: {
          media_type?: string;
          with_genres?: string;
          with_watch_providers?: string;
          watch_region?: string;
          page?: string;
          sort_by?: string;
          prioritize_trending?: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key_here") {
        return tmdbKeyMissing(reply);
      }
      try {
        const mediaType = request.query.media_type === "tv" ? "tv" : "movie";
        const with_genres = request.query.with_genres;
        const with_watch_providers = request.query.with_watch_providers;
        const watch_region = request.query.watch_region || "US";
        const page = request.query.page || "1";
        const sort_by = request.query.sort_by || "popularity.desc";
        const prioritizeTrending = request.query.prioritize_trending === "1";

        let url = `${TMDB_BASE_URL}/discover/${mediaType}?include_adult=false&language=en-US&page=${page}&sort_by=${sort_by}&api_key=${TMDB_API_KEY}`;
        if (with_genres) {
          url += `&with_genres=${with_genres}`;
        }
        if (with_watch_providers) {
          url += `&with_watch_providers=${with_watch_providers}&watch_region=${watch_region}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`TMDb API error: ${response.statusText}`);
        }
        const data = (await response.json()) as {
          results?: Array<{ id: number }>;
          page?: number;
          total_pages?: number;
          total_results?: number;
          [key: string]: unknown;
        };

        if (prioritizeTrending && Array.isArray(data.results)) {
          const trendingRes = await fetch(
            `${TMDB_BASE_URL}/trending/${mediaType}/week?language=en-US&page=1&api_key=${TMDB_API_KEY}`,
          );
          if (trendingRes.ok) {
            const trending = (await trendingRes.json()) as {
              results?: Array<{ id: number }>;
            };
            const trendingIds = (trending.results ?? []).map((x) => x.id);
            data.results = sortByTrendingPriority(data.results, trendingIds);
          }
        }

        return reply.send(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Internal server error";
        return reply.status(500).send({ error: message });
      }
    },
  );

  fastify.get(
    "/api/tmdb/tv/season",
    async (
      request: FastifyRequest<{
        Querystring: { tv_id?: string; season_number?: string };
      }>,
      reply: FastifyReply,
    ) => {
      if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key_here") {
        return tmdbKeyMissing(reply);
      }
      try {
        const tvId = request.query.tv_id;
        const season = request.query.season_number;
        if (!tvId || season == null) {
          return reply
            .status(400)
            .send({ error: "tv_id and season_number are required" });
        }
        const url = `${TMDB_BASE_URL}/tv/${encodeURIComponent(tvId)}/season/${encodeURIComponent(season)}?language=en-US&api_key=${TMDB_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) {
          return reply
            .status(res.status)
            .send({ error: `TMDb error: ${res.statusText}` });
        }
        const data = await res.json();
        return reply.send(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Internal server error";
        return reply.status(500).send({ error: message });
      }
    },
  );
}
