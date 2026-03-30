/**
 * TMDB discover/movie `with_watch_providers` IDs for US (`watch_region=US`).
 * @see https://developer.themoviedb.org/reference/discover-movie
 */
export type StreamingProvider = {
  slug: string;
  /** Label in dropdown / short UI */
  navLabel: string;
  /** Page title / hero */
  name: string;
  tmdbProviderId: number;
};

export const STREAMING_PROVIDERS: StreamingProvider[] = [
  { slug: "netflix", navLabel: "Netflix", name: "Netflix", tmdbProviderId: 8 },
  {
    slug: "apple-tv",
    navLabel: "Apple TV",
    name: "Apple TV",
    tmdbProviderId: 350,
  },
  { slug: "disney", navLabel: "Disney+", name: "Disney+", tmdbProviderId: 337 },
  {
    slug: "paramount",
    navLabel: "Paramount+",
    name: "Paramount+",
    tmdbProviderId: 531,
  },
  {
    slug: "prime",
    navLabel: "Prime Video",
    name: "Prime Video",
    tmdbProviderId: 9,
  },
  {
    slug: "hbo-max",
    navLabel: "HBO Max",
    name: "HBO Max",
    tmdbProviderId: 384,
  },
];

const bySlug = new Map(STREAMING_PROVIDERS.map((p) => [p.slug, p]));

export function getProviderBySlug(slug: string): StreamingProvider | undefined {
  return bySlug.get(slug);
}
