import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getTorrentioBaseUrl } from "../lib/torrentio-url";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL =
  process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

type TorrentioStream = {
  title?: string;
  name?: string;
  infoHash?: string;
};

function parseSizeToBytes(sizeStr: string): number {
  const match = sizeStr.match(/([0-9.]+)\s*(GB|MB|KB|B)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  switch (unit) {
    case "GB":
      return Math.floor(val * 1024 * 1024 * 1024);
    case "MB":
      return Math.floor(val * 1024 * 1024);
    case "KB":
      return Math.floor(val * 1024);
    default:
      return Math.floor(val);
  }
}

export default async function (fastify: FastifyInstance) {
  fastify.get(
    "/api/torrentio/search",
    async (
      request: FastifyRequest<{
        Querystring: { tmdbId?: string; imdbId?: string };
      }>,
      reply: FastifyReply,
    ) => {
      let imdbId = request.query.imdbId ?? null;
      const tmdbId = request.query.tmdbId;

      if (!imdbId && !tmdbId) {
        return reply.status(400).send({ error: "Missing tmdbId or imdbId" });
      }

      try {
        if (!imdbId && tmdbId) {
          if (!TMDB_API_KEY) {
            throw new Error("TMDB_API_KEY is not configured");
          }
          const tmdbRes = await fetch(
            `${TMDB_BASE_URL}/movie/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`,
          );
          if (tmdbRes.ok) {
            const external = (await tmdbRes.json()) as { imdb_id?: string };
            imdbId = external.imdb_id ?? null;
          }
        }

        if (!imdbId) {
          return reply
            .status(404)
            .send({ error: "Could not find IMDB ID for this movie" });
        }

        const torrentioUrl = `${getTorrentioBaseUrl()}/providers=yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrent9,horriblesubs,nyaasi,tokyotosho,sukebei/stream/movie/${imdbId}.json`;

        const response = await fetch(torrentioUrl);
        if (!response.ok) {
          throw new Error(`Torrentio returned ${response.status}`);
        }

        const data = (await response.json()) as { streams?: TorrentioStream[] };
        const streams = data.streams || [];
        const results = streams.map((s) => {
          const parts = (s.title || s.name || "").split("\n");
          const filename = parts[0];
          const infoLine = parts[1] || "";
          const seederMatch = infoLine.match(/(?:👤|S:)\s*([0-9]+)/i);
          const sizeMatch = infoLine.match(
            /(?:💾|size:)?\s*([0-9.]+\s*(GB|MB|KB|B))/i,
          );
          const sizeStr = sizeMatch ? sizeMatch[1].trim() : "Unknown";
          const seeders = seederMatch ? parseInt(seederMatch[1], 10) : 0;
          return {
            title: filename || s.name,
            sizeStr,
            sizeBytes: parseSizeToBytes(sizeStr) || 1,
            seeders,
            magnetUri: s.infoHash ? `magnet:?xt=urn:btih:${s.infoHash}` : null,
            infoHash: s.infoHash,
            details: infoLine,
            source: s.name,
          };
        });

        return reply.send({ results });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Torrentio search failed";
        return reply.status(500).send({ error: message });
      }
    },
  );
}
