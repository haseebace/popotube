"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const navLinkClass = isHome
    ? "text-[20px] font-medium text-white/80 hover:text-white transition-colors"
    : "text-[20px] font-medium text-neutral-900 hover:text-black transition-colors";

  const iconButtonClass = isHome
    ? "text-white hover:text-white hover:bg-transparent"
    : "text-neutral-900 hover:text-black hover:bg-muted";

  const logoClass = isHome ? "text-white" : "text-neutral-900";

  return (
    <header
      className={cn(
        "z-50 w-full transition-all duration-300",
        isHome
          ? "absolute top-0 bg-transparent text-white border-none shadow-none"
          : "sticky top-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-neutral-900",
      )}
    >
      <div className="container mx-auto flex h-24 items-center justify-between px-6 ">
        {/* Left Section: Menu + Nav */}
        <div className="flex items-center gap-8">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn("p-0", iconButtonClass)}
            >
              <Menu className="h-[20px] w-[20px]" />
            </Button>
          </motion.div>

          <nav className="hidden lg:flex items-center gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Link href="/" className={cn("whitespace-nowrap", navLinkClass)}>
                Home
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Link
                href="/categories"
                className={cn("whitespace-nowrap", navLinkClass)}
              >
                Categories
              </Link>
            </motion.div>
          </nav>
        </div>

        {/* Center Section: Logo */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 flex items-center"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 font-black text-3xl tracking-tighter",
              logoClass,
            )}
          >
            <span>POPOTUBE</span>
          </Link>
        </motion.div>

        {/* Right Section: Icons */}
        <div className="flex items-center gap-6">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Button variant="ghost" size="icon" className={iconButtonClass}>
              <Search className="h-[20px] w-[20px]" />
            </Button>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
