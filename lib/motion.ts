import type { Transition, Variants } from "framer-motion";

/**
 * PRD §3 — watch route shell (use on template `motion.div` as inline props, not `variants`,
 * so nested `hidden`/`show` stagger trees are not overridden by inherited variant names).
 */
export const watchPageEnter = { opacity: 0, y: 16 };

export const watchPageAnimate = {
  opacity: 1,
  y: 0,
  transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const },
};

export const watchPageExit = {
  opacity: 0,
  y: -12,
  transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as const },
};

/** PRD §4.3 — hero copy stagger (y: 20). */
export const fadeUpHero: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const staggerHero: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.35,
    },
  },
};

/** PRD §4.1 — backdrop wrapper (not the Image node). */
export const heroBackdrop: Variants = {
  hidden: { scale: 1.04, opacity: 0.6 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 1.2, ease: "easeOut" },
  },
};

/** PRD §4.2 */
export const heroGradientOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.8, delay: 0.3 },
  },
};

/** PRD §5.1 */
export const inViewFadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export const inViewViewport = { once: true, margin: "-60px" } as const;

/** PRD §5.2 */
export const staggerCast: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

export const fadeUpCastRow: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

/** PRD §6.1 */
export const recommendedHeader: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

/** PRD §6.2 */
export const staggerRecommended: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const recommendedCard: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const recommendedRowViewport = { once: true, margin: "-80px" } as const;

/** PRD §8 — springs */
export const springCta: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
};

export const springCardHover: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 22,
};

/** Navbar slide-in on load */
export const navEntry = {
  initial: { y: -60, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      delay: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};
