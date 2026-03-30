/**
 * Shared public-noir hero / row CTAs — same padding, `rounded-noir`, and motion on home + watch.
 * Use with `className={cn(noirCtaPrimary, "optional-extra")}` if needed.
 */
export const noirCtaRow = "flex flex-wrap items-center gap-4 pt-4";

/** Primary: white fill, dark label (matches design-system §5). */
export const noirCtaPrimary =
  "inline-flex items-center justify-center gap-2 rounded-noir bg-noir-primary px-6 py-2.5 text-sm font-bold text-noir-on-primary transition-colors duration-200 hover:bg-noir-secondary active:scale-95 md:px-8 md:py-3 md:text-base";

/** Secondary: outline, transparent fill. */
export const noirCtaSecondary =
  "inline-flex items-center justify-center gap-2 rounded-noir border border-outline-variant/40 bg-transparent px-6 py-2.5 text-sm font-bold text-noir-primary transition-colors duration-200 hover:bg-white/10 active:scale-95 md:px-8 md:py-3 md:text-base";

/** Same styles without CSS active:scale — pair with Framer `whileTap` (watch page). */
export const noirCtaPrimaryMotion =
  "inline-flex items-center justify-center gap-2 rounded-noir bg-noir-primary px-6 py-2.5 text-sm font-bold text-noir-on-primary transition-colors duration-200 hover:bg-noir-secondary md:px-8 md:py-3 md:text-base";

export const noirCtaSecondaryMotion =
  "inline-flex items-center justify-center gap-2 rounded-noir border border-outline-variant/40 bg-transparent px-6 py-2.5 text-sm font-bold text-noir-primary transition-colors duration-200 hover:bg-white/10 md:px-8 md:py-3 md:text-base";
