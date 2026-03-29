import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type StripMovie = {
  id: number;
  title: string;
  poster_path?: string | null;
  release_date?: string;
  genre_ids?: number[];
  /** Precomputed on the server (genre / year). */
  subtitle: string;
};

type Props = {
  sectionIndex: string;
  title: string;
  movies: StripMovie[];
};

export default function HomeTrendingStrip({
  sectionIndex,
  title,
  movies,
}: Props) {
  return (
    <section className="pl-12">
      <div className="mb-8 flex items-end justify-between pr-12">
        <div>
          <span className="label-md mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
            {sectionIndex}
          </span>
          <h2 className="text-3xl font-bold uppercase tracking-tight text-noir-primary">
            {title}
          </h2>
        </div>
        <Link
          href="/categories"
          className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-neutral-400 transition-colors hover:text-white"
        >
          View All
          <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
        </Link>
      </div>
      <div className="no-scrollbar flex gap-6 overflow-x-auto pr-12">
        {movies.map((m) => {
          const poster = m.poster_path
            ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
            : null;
          return (
            <Link
              key={m.id}
              href={`/watch/${m.id}`}
              className="group w-[320px] shrink-0 cursor-pointer"
            >
              <div className="relative mb-4 aspect-[2/3] overflow-hidden rounded-noir bg-surface-container">
                {poster ? (
                  <Image
                    src={poster}
                    alt={m.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="320px"
                  />
                ) : null}
                <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/0" />
              </div>
              <h3 className="font-bold uppercase tracking-tight text-noir-primary">
                {m.title}
              </h3>
              <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">
                {m.subtitle}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
