import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { noirCtaPrimary, noirCtaSecondary, noirCtaRow } from "@/lib/noir-cta-styles";

export type FeaturedMovie = {
  id: number;
  title: string;
  overview?: string;
  backdrop_path?: string | null;
};

type Props = {
  movie: FeaturedMovie;
  genreLine: string;
};

function titleWithMidBreak(title: string) {
  const words = title.trim().split(/\s+/);
  if (words.length <= 1) {
    return <>{title.toUpperCase()}</>;
  }
  const mid = Math.ceil(words.length / 2);
  const a = words.slice(0, mid).join(" ").toUpperCase();
  const b = words.slice(mid).join(" ").toUpperCase();
  return (
    <>
      {a}
      <br />
      {b}
    </>
  );
}

export default function HomeFeaturedHero({ movie, genreLine }: Props) {
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : "";

  return (
    <section className="relative h-[921px] w-full overflow-hidden bg-surface-container-lowest">
      {backdropUrl ? (
        <Image
          src={backdropUrl}
          alt={movie.title}
          fill
          priority
          className="object-cover opacity-60"
          sizes="100vw"
        />
      ) : null}
      <div
        className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"
        aria-hidden
      />
      <div className="absolute bottom-0 left-0 z-10 w-full px-12 pb-24">
        <div className="max-w-3xl space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="rounded-noir bg-noir-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-noir-on-primary">
              Featured Selection
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-noir-secondary">
              {genreLine}
            </span>
          </div>
          <h1 className="text-6xl font-extrabold leading-tight tracking-tighter text-noir-primary md:text-8xl">
            {titleWithMidBreak(movie.title)}
          </h1>
          {movie.overview ? (
            <p className="max-w-xl text-lg font-light leading-relaxed text-noir-secondary">
              {movie.overview.length > 220
                ? `${movie.overview.slice(0, 217)}…`
                : movie.overview}
            </p>
          ) : null}
          <div className={noirCtaRow}>
            <Link href={`/watch/${movie.id}`} className={noirCtaPrimary}>
              <Play
                className="h-6 w-6 shrink-0 fill-noir-on-primary text-noir-on-primary"
                aria-hidden
              />
              WATCH NOW
            </Link>
            <Link href={`/watch/${movie.id}`} className={noirCtaSecondary}>
              FILM DETAILS
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
