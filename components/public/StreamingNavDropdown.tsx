"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronDown, Tv } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STREAMING_PROVIDERS } from "@/lib/streaming-providers";

function streamingActive(pathname: string) {
  return STREAMING_PROVIDERS.some((p) => pathname === `/browse/${p.slug}`);
}

type Variant = "desktop" | "mobile";

export function StreamingNavDropdown({ variant }: { variant: Variant }) {
  const pathname = usePathname();
  const active = streamingActive(pathname);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "desktop" ? (
          <motion.button
            type="button"
            className={
              active
                ? "flex items-center gap-1 border-b-2 border-white pb-1 text-sm font-medium text-white"
                : "flex items-center gap-1 border-b-2 border-transparent pb-1 text-sm font-medium text-neutral-400 transition-colors hover:text-white"
            }
            whileHover={{ y: -1 }}
            transition={{ duration: 0.15 }}
          >
            Streaming
            <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            className={
              active
                ? "text-white"
                : "text-neutral-400 transition-colors hover:text-white"
            }
            aria-label="Streaming providers"
            whileTap={{ scale: 0.94 }}
          >
            <Tv className="h-6 w-6" strokeWidth={1.5} />
          </motion.button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={variant === "mobile" ? "end" : "start"}
        sideOffset={8}
      >
        {STREAMING_PROVIDERS.map((p) => (
          <DropdownMenuItem key={p.slug} asChild>
            <Link href={`/browse/${p.slug}`}>{p.navLabel}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
