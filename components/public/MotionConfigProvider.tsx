"use client";

import { MotionConfig } from "framer-motion";

/**
 * PRD §10 — `user` respects `prefers-reduced-motion` (Framer shortens motion to ~0s).
 * Scroll-linked values (e.g. navbar `useTransform`) can still feel “animated”.
 *
 * To verify motion in dev when the OS has Reduce Motion on, set in `.env`:
 * `NEXT_PUBLIC_MOTION_IGNORE_REDUCED=1`
 */
export default function MotionConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const ignoreReduced =
    process.env.NEXT_PUBLIC_MOTION_IGNORE_REDUCED === "1";

  return (
    <MotionConfig reducedMotion={ignoreReduced ? "never" : "user"}>
      {children}
    </MotionConfig>
  );
}
