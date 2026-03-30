import { notFound } from "next/navigation";
import type { Metadata } from "next";
import StreamingCatalogExperience from "@/components/public/browse/StreamingCatalogExperience";
import { getProviderBySlug, STREAMING_PROVIDERS } from "@/lib/streaming-providers";
import { fetchProviderCatalogPage } from "@/lib/tmdb-provider-catalog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return STREAMING_PROVIDERS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProviderBySlug(slug);
  if (!p) return { title: "Not found" };
  return {
    title: `${p.name} — Stream | PoPoTube`,
    description: `Browse popular movies streaming on ${p.name} (US).`,
  };
}

export default async function BrowseProviderPage({ params }: Props) {
  const { slug } = await params;
  const provider = getProviderBySlug(slug);
  if (!provider) notFound();

  const initial = await fetchProviderCatalogPage(provider.tmdbProviderId, 1);

  if (!initial) {
    return (
      <div className="-mt-14 flex min-h-[60vh] items-center justify-center bg-surface px-6 pt-28 font-body text-on-surface-variant">
        <p className="text-center">
          Could not load catalog. Check{" "}
          <span className="text-noir-primary">TMDB_API_KEY</span> or try again later.
        </p>
      </div>
    );
  }

  return <StreamingCatalogExperience provider={provider} initial={initial} />;
}
