import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

type SearchQuery = {
  q?: string;
};

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/api/search",
    async (
      request: FastifyRequest<{ Querystring: SearchQuery }>,
      reply: FastifyReply,
    ) => {
      const query = request.query.q;

      if (!query || query.trim() === "") {
        return reply
          .status(400)
          .send({ error: "Query parameter 'q' is required" });
      }

      const jackettUrl = process.env.JACKETT_URL || "http://127.0.0.1:9117";
      const jackettApiKey = process.env.JACKETT_API_KEY;

      if (!jackettApiKey || jackettApiKey === "your_api_key_here") {
        return reply.status(500).send({
          error:
            "Jackett API key not configured. Set JACKETT_API_KEY in backend env.",
        });
      }

      const jackettEndpoint = `${jackettUrl}/api/v2.0/indexers/all/results?apikey=${jackettApiKey}&Query=${encodeURIComponent(query)}&_=${Date.now()}`;

      try {
        const response = await fetch(jackettEndpoint, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          return reply.status(response.status).send({
            error: `Jackett returned an error: ${response.status} ${response.statusText}`,
          });
        }

        const data = (await response.json()) as {
          Results?: Array<{
            Title: string;
            Tracker: string;
            TrackerId: string;
            CategoryDesc: string;
            Size: number;
            Seeders: number;
            Peers: number;
            PublishDate: string;
            MagnetUri: string | null;
            Link: string | null;
            Details: string | null;
            Imdb: string | null;
            InfoHash: string | null;
          }>;
        };

        const results = (data.Results || []).map((item) => ({
          title: item.Title,
          tracker: item.Tracker,
          trackerId: item.TrackerId,
          category: item.CategoryDesc,
          size: item.Size,
          seeders: item.Seeders,
          leechers: item.Peers,
          publishDate: item.PublishDate,
          magnetUri: item.MagnetUri,
          downloadLink: item.Link,
          detailsLink: item.Details,
          imdb: item.Imdb,
          infoHash: item.InfoHash,
        }));

        return reply.send({
          query,
          totalResults: results.length,
          results,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "TimeoutError") {
          return reply.status(504).send({
            error:
              "Jackett request timed out. Make sure Jackett is reachable from backend.",
          });
        }

        return reply.status(503).send({
          error:
            "Failed to connect to Jackett. Make sure it is running and reachable from backend.",
        });
      }
    },
  );
}
