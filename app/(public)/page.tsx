import HomeFeaturedHero from "@/components/public/home/HomeFeaturedHero";
import HomeTrendingStrip from "@/components/public/home/HomeTrendingStrip";
import HomeIndieGrid from "@/components/public/home/HomeIndieGrid";
import HomeNewArrivalsStrip from "@/components/public/home/HomeNewArrivalsStrip";
import HomeSiteFooter from "@/components/public/home/HomeSiteFooter";
import { genreSlashLine } from "@/lib/tmdb-genre-labels";

type TMDBListMovie = {
  id: number;
  title: string;
  overview?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
  release_date?: string;
  genre_ids?: number[];
  vote_average?: number;
};

type TMDBListResponse = {
  results?: TMDBListMovie[];
};

async function fetchTmdb(path: string): Promise<TMDBListResponse | null> {
  const key = process.env.TMDB_API_KEY;
  const base = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
  if (!key) return null;
  const sep = path.includes("?") ? "&" : "?";
  const url = `${base}${path}${sep}api_key=${key}&language=en-US`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return (await res.json()) as TMDBListResponse;
}

export default async function PublicHomepage() {
  const [trending, nowPlaying] = await Promise.all([
    fetchTmdb("/trending/movie/day"),
    fetchTmdb("/movie/now_playing?page=1"),
  ]);

  const tResults = trending?.results ?? [];
  const featured = tResults[0];
  const arrivals = (nowPlaying?.results ?? []).slice(0, 6);

  if (!featured) {
    return (
      <div className="-mt-14 flex min-h-[60vh] items-center justify-center bg-surface px-6 font-body text-on-surface">
        <p className="text-center text-on-surface-variant">
          No catalogue data. Configure{" "}
          <span className="text-noir-primary">TMDB_API_KEY</span> to load the
          homepage.
        </p>
      </div>
    );
  }

  const strip = tResults.slice(0, 8);
  const indieLarge = tResults[3] ?? tResults[0];
  const indieTop = tResults[4] ?? tResults[1];
  const indieBot = tResults[5] ?? tResults[2];

  return (
    <div className="-mt-14 min-h-screen bg-surface font-body text-on-surface antialiased tracking-tight selection:bg-cinema-primary selection:text-cinema-on-primary">
      <main className="pt-0">
        <HomeFeaturedHero
          movie={{
            id: featured.id,
            title: featured.title,
            overview: featured.overview,
            backdrop_path: featured.backdrop_path,
            vote_average: featured.vote_average,
            release_date: featured.release_date,
          }}
          genreLine={genreSlashLine(featured.genre_ids)}
        />

        <div className="space-y-12 bg-surface py-12 md:space-y-20 md:py-20">
          <HomeTrendingStrip
            sectionIndex="01"
            title="Trending Now"
            movies={strip.map((m) => {
              const y = m.release_date?.slice(0, 4) ?? "—";
              return {
                id: m.id,
                title: m.title,
                poster_path: m.poster_path,
                release_date: m.release_date,
                genre_ids: m.genre_ids,
                subtitle: `${genreSlashLine(m.genre_ids)} / ${y}`,
              };
            })}
          />

          <HomeIndieGrid
            large={{
              id: indieLarge.id,
              title: indieLarge.title,
              overview: indieLarge.overview,
              backdrop_path: indieLarge.backdrop_path,
              poster_path: indieLarge.poster_path,
            }}
            smallTop={{
              id: indieTop.id,
              title: indieTop.title,
              overview: indieTop.overview,
              backdrop_path: indieTop.backdrop_path,
              poster_path: indieTop.poster_path,
            }}
            smallBottom={{
              id: indieBot.id,
              title: indieBot.title,
              overview: indieBot.overview,
              backdrop_path: indieBot.backdrop_path,
              poster_path: indieBot.poster_path,
            }}
          />

          {arrivals.length > 0 ? (
            <HomeNewArrivalsStrip
              movies={arrivals.map((m) => {
                const y = m.release_date?.slice(0, 4) ?? "—";
                return {
                  id: m.id,
                  title: m.title,
                  poster_path: m.poster_path,
                  backdrop_path: m.backdrop_path,
                  release_date: m.release_date,
                  subtitle: `${genreSlashLine(m.genre_ids)} / ${y}`,
                };
              })}
            />
          ) : null}
        </div>
      </main>

      <HomeSiteFooter />
    </div>
  );
}
