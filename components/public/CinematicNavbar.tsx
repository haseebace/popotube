"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
} from "framer-motion";
import { Search, User } from "lucide-react";
import { navEntry, springCta } from "@/lib/motion";

const links = [
  { href: "/", label: "Browse" },
  { href: "/categories", label: "My Library" },
];

export default function CinematicNavbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const navAlpha = useTransform(scrollY, [0, 80], [0.55, 0.92]);
  const backgroundColor = useMotionTemplate`rgba(23, 23, 23, ${navAlpha})`;

  return (
    <motion.header
      className="fixed top-0 z-50 w-full font-body antialiased tracking-tight backdrop-blur-xl editorial-shadow"
      style={{ backgroundColor }}
      initial={navEntry.initial}
      animate={navEntry.animate}
    >
      <div className="mx-auto flex w-full max-w-none items-center justify-between px-8 py-4">
        <div className="flex items-center gap-12">
          <Link
            href="/"
            className="text-xl font-bold tracking-tighter text-white uppercase"
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
          <form
            action="/search"
            method="get"
            className="hidden items-center gap-2 rounded-noir bg-neutral-800/50 px-4 py-1.5 md:flex"
          >
            <Search className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            <input
              name="q"
              type="search"
              placeholder="Search films..."
              className="w-48 border-none bg-transparent text-sm text-white placeholder-neutral-500 focus:ring-0 focus:outline-none"
              aria-label="Search films"
            />
          </form>
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
