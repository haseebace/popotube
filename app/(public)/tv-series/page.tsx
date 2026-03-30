import type { Metadata } from "next";
import TmdbMediaCatalogExperience from "@/components/public/browse/TmdbMediaCatalogExperience";
import { fetchTmdbCatalogPage } from "@/lib/tmdb-media-catalog";

const TOP_PROVIDER_IDS = "8|384|337|350"; // Netflix, HBO Max, Disney+, Apple TV

export const metadata: Metadata = {
  title: "TV Series — Catalog | PoPoTube",
  description: "Browse popular TV series from TMDB.",
};

export default async function TvSeriesPage() {
  const initial = await fetchTmdbCatalogPage("tv", 1, {
    withWatchProviders: TOP_PROVIDER_IDS,
    watchRegion: "US",
  });

  if (!initial) {
    return (
      <div className="-mt-14 flex min-h-[60vh] items-center justify-center bg-surface px-6 pt-28 font-body text-on-surface-variant">
        <p className="text-center">
          Could not load TV series. Check{" "}
          <span className="text-noir-primary">TMDB_API_KEY</span> or try again
          later.
        </p>
      </div>
    );
  }

  return (
    <TmdbMediaCatalogExperience
      mediaType="tv"
      title="TV Series"
      subtitle="Popular trending TV series on Netflix, HBO Max, Disney+, and Apple TV."
      initial={initial}
      withWatchProviders={TOP_PROVIDER_IDS}
      watchRegion="US"
    />
  );
}
