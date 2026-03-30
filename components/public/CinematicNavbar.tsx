"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import { Search, User, Loader2 } from "lucide-react";
import { navEntry, springCta, springSearchBar } from "@/lib/motion";
import { StreamingNavDropdown } from "@/components/public/StreamingNavDropdown";
import { STREAMING_PROVIDERS } from "@/lib/streaming-providers";

const links = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "Catalog" },
  { href: "/movies", label: "Movies" },
  { href: "/tv-series", label: "TV Series" },
];

interface SearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

const SEARCH_COLLAPSED_W = 44;
const SEARCH_EXPANDED_W = 300;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function CinematicNavbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const navAlpha = useTransform(scrollY, [0, 80], [0.45, 0.82]);
  const backgroundColor = useMotionTemplate`rgba(23, 23, 23, ${navAlpha})`;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSearchExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchExpanded) {
      const t = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(t);
    }
  }, [searchExpanded]);

  useEffect(() => {
    if (!searchExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchExpanded(false);
        setShowDropdown(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [searchExpanded]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/tmdb/search?query=${encodeURIComponent(debouncedQuery)}`,
        );
        const data = await res.json();
        setResults(data.results?.slice(0, 5) || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };
    fetchResults();
  }, [debouncedQuery]);

  return (
    <motion.header
      className="fixed top-0 z-50 w-full font-body antialiased tracking-tight backdrop-blur-xl editorial-shadow"
      style={{ backgroundColor }}
      initial={navEntry.initial}
      animate={navEntry.animate}
    >
      <div className="mx-auto flex w-full max-w-none items-center justify-between px-4 py-3 md:px-8 md:py-5">
        <div className="flex items-center gap-12">
          <Link
            href="/"
            className="text-xl font-black tracking-tighter text-white uppercase"
          >
            PoPoTube
          </Link>
          <div className="hidden flex-wrap items-center gap-x-8 gap-y-3 md:flex">
            {links.map(({ href, label }) => {
              const active =
                href === "/"
                  ? pathname === "/"
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <motion.div
                  key={href}
                  className="inline-block"
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.15 }}
                >
                  <Link
                    href={href}
                    className={
                      active
                        ? "border-b-2 border-white pb-1 text-white"
                        : "text-neutral-400 transition-colors hover:text-white"
                    }
                  >
                    {label}
                  </Link>
                </motion.div>
              );
            })}
            <div className="hidden items-center gap-x-5 gap-y-2 border-l border-white/15 pl-8 lg:flex">
              {STREAMING_PROVIDERS.map((p) => {
                const active = pathname === `/browse/${p.slug}`;
                return (
                  <motion.div
                    key={p.slug}
                    className="inline-block"
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link
                      href={`/browse/${p.slug}`}
                      className={
                        active
                          ? "whitespace-nowrap border-b-2 border-white pb-1 text-xs font-medium text-white"
                          : "whitespace-nowrap text-xs font-medium text-neutral-400 transition-colors hover:text-white"
                      }
                    >
                      {p.navLabel}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex lg:hidden">
              <StreamingNavDropdown variant="desktop" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="md:hidden">
            <StreamingNavDropdown variant="mobile" />
          </div>
          <div className="relative hidden md:block" ref={dropdownRef}>
            <motion.div
              className="flex overflow-hidden rounded-noir bg-neutral-800/50"
              initial={false}
              animate={{
                width: searchExpanded ? SEARCH_EXPANDED_W : SEARCH_COLLAPSED_W,
              }}
              transition={springSearchBar}
            >
              <form
                action="/search"
                method="get"
                className="flex min-w-0 flex-1 items-center gap-2 py-1.5 pl-1 pr-3"
              >
                <motion.button
                  type="button"
                  aria-expanded={searchExpanded}
                  aria-label={searchExpanded ? undefined : "Open search"}
                  aria-hidden={searchExpanded}
                  tabIndex={searchExpanded ? -1 : 0}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-noir text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
                  onClick={() => {
                    setSearchExpanded(true);
                    if (query.trim()) setShowDropdown(true);
                  }}
                  whileTap={{ scale: 0.94 }}
                  transition={springCta}
                >
                  <Search className="h-4 w-4" aria-hidden />
                </motion.button>
                <motion.div
                  className="flex min-w-0 flex-1 items-center gap-2"
                  initial={false}
                  animate={{
                    opacity: searchExpanded ? 1 : 0,
                    x: searchExpanded ? 0 : -12,
                  }}
                  transition={springSearchBar}
                  style={{ pointerEvents: searchExpanded ? "auto" : "none" }}
                >
                  <input
                    ref={searchInputRef}
                    name="q"
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      if (query.trim()) setShowDropdown(true);
                    }}
                    placeholder="Search films..."
                    className="min-w-0 flex-1 border-none bg-transparent text-sm text-white placeholder-neutral-500 focus:ring-0 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
                    aria-label="Search films"
                    autoComplete="off"
                  />
                  {isSearching && (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-neutral-400" />
                  )}
                </motion.div>
              </form>
            </motion.div>

            {showDropdown && query.trim() && (
              <div className="absolute top-full right-0 mt-2 w-[320px] rounded-noir border border-outline-variant/20 bg-surface-container-high/95 p-2 backdrop-blur-xl shadow-2xl">
                {results.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {results.map((movie) => (
                      <Link
                        key={movie.id}
                        href={`/watch/${movie.id}`}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 rounded-noir p-2 hover:bg-white/10 transition-colors"
                      >
                        <div className="h-[60px] w-10 shrink-0 overflow-hidden rounded-[2px] bg-surface-container-lowest">
                          {movie.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                              alt={movie.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-600">
                              No Img
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="truncate text-sm font-medium text-white">
                            {movie.title}
                          </span>
                          {movie.release_date && (
                            <span className="text-xs text-neutral-400">
                              {movie.release_date.split("-")[0]}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}`}
                      onClick={() => setShowDropdown(false)}
                      className="mt-1 block w-full rounded-noir p-2 text-center text-xs font-medium text-neutral-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      View all results for &quot;{query}&quot;
                    </Link>
                  </div>
                ) : !isSearching ? (
                  <div className="p-4 text-center text-sm text-neutral-400">
                    No results found
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <Link
            href="/search"
            className="text-neutral-400 transition-colors hover:text-white md:hidden"
            aria-label="Search"
          >
            <Search className="h-6 w-6" strokeWidth={1.5} />
          </Link>
          <motion.button
            type="button"
            className="text-white"
            aria-label="Account"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={springCta}
          >
            <User className="h-6 w-6" strokeWidth={1.5} />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
