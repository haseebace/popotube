"use client";

import { usePathname } from "next/navigation";

/**
 * Remount watch UI when `tmdb_id` changes. Page motion lives inside
 * `WatchMovieExperience` (avoids wrapping RSC output in AnimatePresence/motion
 * quirks with nested variant trees).
 */
export default function WatchTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="min-w-0 flex-1">
      {children}
    </div>
  );
}
