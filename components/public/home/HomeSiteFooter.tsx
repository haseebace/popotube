import Link from "next/link";

export default function HomeSiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t border-neutral-800/20 bg-neutral-950">
      <div className="flex w-full flex-col items-center justify-between gap-8 px-12 py-16 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <span className="text-lg font-bold uppercase tracking-tighter text-noir-primary">
            PoPoTube
          </span>
          <p className="font-body text-xs uppercase tracking-[0.1em] text-neutral-500">
            © {year} PoPoTube. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-12">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
              Discover
            </span>
            <Link
              href="/"
              className="font-body text-xs uppercase tracking-[0.1em] text-neutral-500 transition-colors duration-300 hover:text-white"
            >
              Browse
            </Link>
            <Link
              href="/categories"
              className="font-body text-xs uppercase tracking-[0.1em] text-neutral-500 transition-colors duration-300 hover:text-white"
            >
              My Library
            </Link>
            <Link
              href="/search"
              className="font-body text-xs uppercase tracking-[0.1em] text-neutral-500 transition-colors duration-300 hover:text-white"
            >
              Search
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
              Legal
            </span>
            <span className="font-body text-xs uppercase tracking-[0.1em] text-neutral-500">
              Terms
            </span>
            <span className="font-body text-xs uppercase tracking-[0.1em] text-neutral-500">
              Privacy
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">
              Social
            </span>
            <span className="font-body text-xs uppercase tracking-[0.1em] text-neutral-500">
              Instagram
            </span>
            <span className="font-body text-xs uppercase tracking-[0.1em] text-neutral-500">
              Letterboxd
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
