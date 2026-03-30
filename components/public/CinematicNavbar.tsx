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
import { navEntry, springCta } from "@/lib/motion";

const links = [
  { href: "/", label: "Browse" },
  { href: "/categories", label: "My Library" },
];

interface SearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      <div className="mx-auto flex w-full max-w-none items-center justify-between px-8 py-5">
        <div className="flex items-center gap-12">
          <Link
            href="/"
            className="text-xl font-black tracking-tighter text-white uppercase"
          >
            PoPoTube
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {links.map(({ href, label }) => {
              const active = pathname === href;
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
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative hidden md:block" ref={dropdownRef}>
            <form
              action="/search"
              method="get"
              className="flex items-center gap-2 rounded-noir bg-neutral-800/50 px-4 py-1.5"
            >
              <Search
                className="h-4 w-4 shrink-0 text-neutral-400"
                aria-hidden
              />
              <input
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
                className="w-48 border-none bg-transparent text-sm text-white placeholder-neutral-500 focus:ring-0 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
                aria-label="Search films"
                autoComplete="off"
              />
              {isSearching && (
                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
              )}
            </form>

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
