# 🎬 POPOTUBE — Browse Page

## Framer Motion Animation PRD

**Version 1.2 · March 2026 · Next.js 14+ / React 18 / Framer Motion 11**

> **Changelog from v1.1:**
> Sections marked ✅ **IMPLEMENTED** are confirmed working and must not be modified.
> Sections marked 🔲 **PENDING** are not yet implemented and are next in queue.
> New sections added: §2 variant library now includes `staggerContainer` alias from detail page. §4 navbar fully marked as implemented. §3 page transitions marked implemented. Global setup in §3.1 marked implemented.

---

## Table of Contents

1. [Overview & Goals](#1-overview--goals)
2. [Shared Variant Library](#2-shared-variant-library)
3. [Page Transitions — Entry & Exit](#3-page-transitions--entry--exit)
4. [Navbar](#4-navbar) ✅ IMPLEMENTED
5. [Hero Section](#5-hero-section)
6. [Section Rows — Trending / New Arrivals](#6-section-rows--trending--new-arrivals)
7. [Indie Cinema Editorial Grid](#7-indie-cinema-editorial-grid)
8. [New Arrivals Carousel](#8-new-arrivals-carousel)
9. [Footer](#9-footer)
10. [Micro-Interactions Master Table](#10-micro-interactions-master-table)
11. [Scroll Choreography Map](#11-scroll-choreography-map)
12. [Performance Rules](#12-performance-rules)
13. [Reduced Motion Compliance](#13-reduced-motion-compliance)
14. [Implementation Order](#14-implementation-order)

---

## 1. Overview & Goals

The Browse page is Popotube's highest-traffic surface. It carries a **hero feature** at the top, followed by **horizontally scrollable rows** (Trending Now, New Arrivals), a **large editorial grid** (Indie Cinema), and a footer. The animation layer must:

- Create a **cinematic, premium entry** that guides the eye from hero → rows → grid
- Make the page feel **alive without being busy** — motion only when purposeful
- Keep all animations **GPU-composited** (opacity + transform only — never layout properties)
- Honour **`prefers-reduced-motion`** globally via `<MotionConfig reducedMotion="user">`
- Deliver **60fps on mid-range mobile** (test at 4× CPU throttle)

> **Guiding principle:** The page should feel like a film reel unspooling — the hero breathes open first, then content cascades down the page as the user's eye naturally travels.

---

## 2. Shared Variant Library

> ✅ **IMPLEMENTED** — `/lib/motion.ts` is live. Do not change existing exports. The `staggerContainer` alias below has been added to keep compatibility with the detail page implementation.

Create this file **before writing any component code**. Every animation in this document references these variants.

```ts
// lib/motion.ts

import { Variants } from "framer-motion";

// ─── Fade & Translate ──────────────────────────────────────────
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ─── Stagger Containers ────────────────────────────────────────
export const staggerSlow: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

export const staggerFast: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.0 } },
};

export const staggerCards: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

// ─── staggerContainer: alias kept for detail page compatibility ─
// ✅ IMPLEMENTED on detail page — do not rename or remove
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

// ─── Page Wrapper ──────────────────────────────────────────────
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
  },
};

// ─── Spring presets ────────────────────────────────────────────
export const springSnappy = {
  type: "spring",
  stiffness: 420,
  damping: 26,
} as const;
export const springGentle = {
  type: "spring",
  stiffness: 280,
  damping: 22,
} as const;
export const springBouncy = {
  type: "spring",
  stiffness: 500,
  damping: 20,
} as const;
```

---

## 3. Page Transitions — Entry & Exit

### 3.1 Root Layout Setup

> ✅ **IMPLEMENTED** — `AnimatePresence`, `MotionConfig`, and `initial={false}` are confirmed live in `app/layout.tsx`. Do not touch.

```tsx
// app/layout.tsx
import { AnimatePresence, MotionConfig } from "framer-motion";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <MotionConfig reducedMotion="user">
          <AnimatePresence mode="wait" initial={false}>
            {children}
          </AnimatePresence>
        </MotionConfig>
      </body>
    </html>
  );
}
```

### 3.2 Page Wrapper Component

> ✅ **IMPLEMENTED** — `PageWrapper.tsx` is live and wrapping all pages. Do not touch.

```tsx
// components/PageWrapper.tsx
"use client";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

export default function PageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      key="browse-page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
```

### 3.3 Entry Behaviour

> ✅ **IMPLEMENTED**

| Property  | Value                              | Notes                       |
| --------- | ---------------------------------- | --------------------------- |
| `opacity` | `0 → 1`                            | Full fade in                |
| `y`       | `14px → 0`                         | Subtle upward drift         |
| Duration  | `450ms`                            | Long enough to feel premium |
| Easing    | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Custom ease-out             |
| Trigger   | Route mount                        | Fires once per navigation   |

### 3.4 Exit Behaviour

> ✅ **IMPLEMENTED**

| Property  | Value                               | Notes                                          |
| --------- | ----------------------------------- | ---------------------------------------------- |
| `opacity` | `1 → 0`                             | Clean fade                                     |
| `y`       | `0 → -10px`                         | Page retreats upward                           |
| Duration  | `280ms`                             | Exits **faster** than it enters — feels snappy |
| Easing    | `cubic-bezier(0.4, 0, 1, 1)`        | Ease-in — accelerates out                      |
| Trigger   | Route unmount via `AnimatePresence` |                                                |

> **Design note:** The asymmetry between entry (450ms) and exit (280ms) is intentional. Slow in, fast out — like a cinema curtain.

---

## 4. Navbar

> ✅ **FULLY IMPLEMENTED** — All navbar animations (§4.1 through §4.5) are confirmed working. Do not modify any of this section.

### 4.1 Initial Entry

> ✅ **IMPLEMENTED**

The navbar slides down from above on first load, after a `150ms` delay so it does not race the hero.

```tsx
// components/Navbar.tsx
<motion.nav
  initial={{ y: -56, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
>
```

### 4.2 Scroll-Driven Background

> ✅ **IMPLEMENTED**

Use `useScroll` + `useTransform` — **not** `animate()` — to avoid triggering React re-renders on every scroll tick.

```tsx
"use client";
import {
  useScroll,
  useTransform,
  useMotionTemplate,
  motion,
} from "framer-motion";

export default function Navbar() {
  const { scrollY } = useScroll();

  // Opacity ramps from 0 → 0.92 over the first 100px of scroll
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.92]);
  // Blur ramps from 0 → 12px
  const blurPx = useTransform(scrollY, [0, 100], [0, 12]);
  const backdropBlur = useMotionTemplate`blur(${blurPx}px)`;

  // Subtle bottom border appears on scroll
  const borderOpacity = useTransform(scrollY, [60, 120], [0, 0.15]);

  return (
    <motion.nav
      style={{
        backgroundColor: useMotionTemplate`rgba(10, 10, 18, ${bgOpacity})`,
        backdropFilter: backdropBlur,
        borderBottomColor: useMotionTemplate`rgba(255,255,255,${borderOpacity})`,
        borderBottomWidth: 1,
        borderBottomStyle: "solid",
      }}
    >
      {/* nav content */}
    </motion.nav>
  );
}
```

### 4.3 Nav Link Hover

> ✅ **IMPLEMENTED**

```tsx
<motion.a
  whileHover={{ y: -1, opacity: 1 }}
  whileTap={{ y: 0 }}
  transition={{ duration: 0.15 }}
  style={{ opacity: isActive ? 1 : 0.65 }}
>
  {label}
</motion.a>
```

### 4.4 Search Bar — Focus Expand

> ✅ **IMPLEMENTED**

When the search input is focused, it expands its width smoothly:

```tsx
<motion.input
  animate={{ width: isFocused ? 260 : 180 }}
  transition={springGentle}
  onFocus={() => setIsFocused(true)}
  onBlur={() => setIsFocused(false)}
/>
```

### 4.5 Active Underline Indicator

> ✅ **IMPLEMENTED**

Use a shared `layoutId` so the underline slides between nav items:

```tsx
// In each NavItem
{
  isActive && (
    <motion.span
      layoutId="nav-underline"
      className="absolute bottom-0 left-0 right-0 h-[2px] bg-white"
      transition={springSnappy}
    />
  );
}
```

---

## 5. Hero Section

> 🔲 **PENDING** — None of the hero animations below are implemented yet.

### 5.1 Hero Backdrop Image

The poster image breathes open — a slow zoom-out from slightly enlarged, combined with a dramatic fade from darkness. This mimics a projector warming up.

```tsx
<motion.div
  className="absolute inset-0"
  initial={{ scale: 1.06, opacity: 0 }}
  animate={{ scale: 1.0, opacity: 1 }}
  transition={{ duration: 1.4, ease: "easeOut" }}
>
  <Image src={heroImage} fill alt="" priority />
</motion.div>
```

> **Important:** Apply the scale to the wrapper `div`, not the `<Image>` — Next.js Image must not be a `motion` component directly.

### 5.2 Bottom Gradient Vignette

The gradient overlay that creates legibility for the title fades in slightly after the image:

```tsx
<motion.div
  className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 1.0, delay: 0.4 }}
/>
```

### 5.3 Badge Pills — "FEATURED SELECTION" + "SCIENCE FICTION / ADVENTURE"

The two small badge pills at top-left slide in from the left after the backdrop loads:

```tsx
<motion.div
  className="flex gap-2"
  initial={{ opacity: 0, x: -16 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.4, delay: 0.55 }}
>
  <Badge>FEATURED SELECTION</Badge>
  <Badge variant="outline">SCIENCE FICTION / ADVENTURE</Badge>
</motion.div>
```

### 5.4 Hero Title Stagger

The giant H1 title and body copy below stagger in as a group using a container + children pattern:

```tsx
// Parent
<motion.div
  variants={staggerSlow} // staggerChildren: 0.10
  initial="hidden"
  animate="show"
  style={{ transitionDelay: "0.6s" }} // Starts after backdrop settles
>
  {/* H1 */}
  <motion.h1 variants={fadeUp}>AVATAR: FIRE AND ASH</motion.h1>

  {/* Synopsis */}
  <motion.p variants={fadeUp}>In the wake of the devastating war...</motion.p>

  {/* CTA Buttons */}
  <motion.div variants={fadeUp} className="flex gap-3 mt-4">
    <WatchNowButton />
    <FilmDetailsButton />
  </motion.div>
</motion.div>
```

**Full hero timing sequence:**

| Delay from page load | Element             | Animation                            |
| -------------------- | ------------------- | ------------------------------------ |
| `0ms`                | Hero backdrop image | Scale 1.06→1.0, opacity 0→1 · 1400ms |
| `400ms`              | Gradient vignette   | Opacity 0→1 · 1000ms                 |
| `550ms`              | Badge pills         | Fade + slide from left · 400ms       |
| `600ms`              | H1 title            | Fade up (y:28→0) · 500ms             |
| `700ms`              | Synopsis text       | Fade up (y:28→0) · 500ms             |
| `800ms`              | CTA buttons         | Fade up (y:28→0) · 500ms             |

### 5.5 Watch Now Button — Micro-interactions

```tsx
<motion.button
  whileHover={{ scale: 1.04 }}
  whileTap={{ scale: 0.96 }}
  transition={springSnappy}
  className="btn-primary"
>
  ▶ WATCH NOW
</motion.button>
```

### 5.6 Film Details Button

```tsx
<motion.button
  whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.12)" }}
  whileTap={{ scale: 0.97 }}
  transition={springSnappy}
>
  FILM DETAILS
</motion.button>
```

### 5.7 Hero Parallax on Scroll

As the user scrolls down past the hero, the backdrop image slowly drifts upward — a subtle parallax that makes the hero feel deep and dimensional:

```tsx
"use client";
import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";

export function HeroParallax() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <div ref={ref} className="relative h-screen overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y }}>
        <Image src={heroImage} fill alt="" priority />
      </motion.div>
    </div>
  );
}
```

---

## 6. Section Rows — Trending / New Arrivals

> 🔲 **PENDING**

### 6.1 Section Number + Heading Entry

Each section has a small ordinal number (01, 02, 03) and a bold heading. These fade up when they enter the viewport.

```tsx
<motion.div
  initial="hidden"
  whileInView="show"
  viewport={{ once: true, margin: "-80px" }}
  variants={staggerSlow}
>
  <motion.span variants={fadeUp} className="section-number">
    01
  </motion.span>
  <motion.h2 variants={fadeUp} className="section-title">
    TRENDING NOW
  </motion.h2>
</motion.div>
```

### 6.2 "VIEW ALL →" Link

The view-all link slides in from the right, with an `x` nudge on hover:

```tsx
<motion.a
  variants={fadeLeft}
  initial="hidden"
  whileInView="show"
  viewport={{ once: true }}
  whileHover={{ x: 3 }}
  transition={{ duration: 0.2 }}
>
  VIEW ALL →
</motion.a>
```

### 6.3 Thumbnail Card Row — Staggered Entry

Cards stagger in using `scaleIn` (scale 0.94→1 + opacity 0→1) rather than `fadeUp` — it feels more like content materialising than sliding:

```tsx
<motion.div
  className="flex gap-4 overflow-x-auto"
  variants={staggerCards} // staggerChildren: 0.07
  initial="hidden"
  whileInView="show"
  viewport={{ once: true, margin: "-60px" }}
>
  {films.map((film) => (
    <motion.div key={film.id} variants={scaleIn}>
      <FilmCard film={film} />
    </motion.div>
  ))}
</motion.div>
```

### 6.4 Thumbnail Card — Coordinated Hover

Use a shared `whileHover="hover"` parent with named variants on children — no JS event handlers needed:

```tsx
// Inside FilmCard.tsx
<motion.div
  className="relative cursor-pointer"
  whileHover="hover"
  initial="rest"
>
  {/* Poster */}
  <motion.div
    variants={{
      rest: { scale: 1, y: 0 },
      hover: { scale: 1.05, y: -6 },
    }}
    transition={springGentle}
  >
    <Image src={film.poster} alt={film.title} />
  </motion.div>

  {/* Overlay: fades in on hover */}
  <motion.div
    className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"
    variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
    transition={{ duration: 0.25 }}
  />

  {/* Title + meta: slides up from bottom */}
  <motion.div
    className="absolute bottom-0 p-3"
    variants={{
      rest: { opacity: 0, y: 12 },
      hover: { opacity: 1, y: 0 },
    }}
    transition={{ duration: 0.25, delay: 0.05 }}
  >
    <p className="text-white font-bold text-sm">{film.title}</p>
    <p className="text-white/60 text-xs">{film.meta}</p>
  </motion.div>
</motion.div>
```

### 6.5 Quality Badge (4K / HD)

The quality badge pops in with a spring when the card enters view:

```tsx
<motion.span
  className="quality-badge"
  initial={{ scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ ...springBouncy, delay: index * 0.07 + 0.2 }}
>
  4K
</motion.span>
```

---

## 7. Indie Cinema Editorial Grid

> 🔲 **PENDING**

### 7.1 Section Heading

Same pattern as §6.1:

```tsx
<motion.div
  variants={staggerSlow}
  initial="hidden"
  whileInView="show"
  viewport={{ once: true, margin: "-80px" }}
>
  <motion.span variants={fadeUp}>02</motion.span>
  <motion.h2 variants={fadeUp}>INDIE CINEMA</motion.h2>
</motion.div>
```

### 7.2 Featured Large Card (Left)

The large editorial card gets a more dramatic reveal — scale + fade from slightly smaller:

```tsx
<motion.div
  className="featured-card"
  initial={{ opacity: 0, scale: 0.96, y: 20 }}
  whileInView={{ opacity: 1, scale: 1, y: 0 }}
  viewport={{ once: true, margin: "-60px" }}
  transition={{ duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
  whileHover="hover"
>
  <motion.div
    className="absolute inset-0 bg-black/30"
    variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
    transition={{ duration: 0.3 }}
  />
  <motion.div
    className="absolute bottom-0 p-6"
    variants={{
      rest: { y: 8, opacity: 0.85 },
      hover: { y: 0, opacity: 1 },
    }}
    transition={{ duration: 0.3 }}
  >
    <p className="director-label">DIRECTOR'S CUT</p>
    <h3 className="card-title">MIKE & NICK & NICK & ALICE</h3>
    <p className="synopsis">Two gangsters and the woman...</p>
  </motion.div>
</motion.div>
```

### 7.3 Right-Side Stacked Cards (GOAT + SEND HELP)

The two smaller cards slide in from the right, staggered 120ms apart. The `whileHover={{ x: -3 }}` gives them a directional left-nudge on hover — as if they're eager to be clicked:

```tsx
<motion.div
  className="flex flex-col gap-4"
  variants={{
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
  }}
  initial="hidden"
  whileInView="show"
  viewport={{ once: true, margin: "-60px" }}
>
  {[goat, sendHelp].map((film) => (
    <motion.div
      key={film.id}
      variants={{
        hidden: { opacity: 0, x: 24 },
        show: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
        },
      }}
      whileHover={{ x: -3 }}
      transition={springGentle}
    >
      <SmallEditorialCard film={film} />
    </motion.div>
  ))}
</motion.div>
```

### 7.4 SPOTLIGHT / STAFF PICK Labels

These editorial labels pulse gently to draw the eye. Keep the pulse extremely subtle — any faster feels garish:

```tsx
<motion.span
  className="editorial-label"
  initial={{ opacity: 0.6 }}
  animate={{ opacity: [0.6, 1, 0.6] }}
  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
>
  SPOTLIGHT
</motion.span>
```

---

## 8. New Arrivals Carousel

> 🔲 **PENDING**

### 8.1 Section Entry

Same section heading pattern as §6.1 and §7.1.

### 8.2 Carousel Navigation Arrows

Arrows fade in when the section enters view, with spring press feedback:

```tsx
<motion.button
  initial={{ opacity: 0, scale: 0.8 }}
  whileInView={{ opacity: 1, scale: 1 }}
  viewport={{ once: true }}
  transition={springBouncy}
  whileHover={{ scale: 1.12, backgroundColor: "rgba(255,255,255,0.15)" }}
  whileTap={{ scale: 0.9 }}
>
  ›
</motion.button>
```

### 8.3 Cards Entry — Staggered Scale-In

Same card stagger pattern as §6.3, using `scaleIn` variant.

### 8.4 Carousel Slide Transition

When the user clicks an arrow, incoming cards slide in from the correct direction and outgoing cards exit the other way:

```tsx
<AnimatePresence initial={false} custom={direction} mode="popLayout">
  <motion.div
    key={page}
    custom={direction}
    variants={{
      enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit: (dir: number) => ({
        x: dir > 0 ? "-60%" : "60%",
        opacity: 0,
        scale: 0.96,
      }),
    }}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
  >
    {visibleCards}
  </motion.div>
</AnimatePresence>
```

---

## 9. Footer

> 🔲 **PENDING**

### 9.1 Footer Entry

The footer fades in softly — no aggressive animation, the user is already at journey's end:

```tsx
<motion.footer
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  viewport={{ once: true, margin: '-40px' }}
  transition={{ duration: 0.6 }}
>
```

### 9.2 Footer Links Stagger

Footer columns stagger in gently:

```tsx
<motion.div
  className="footer-columns"
  variants={{ show: { transition: { staggerChildren: 0.08 } } }}
  initial="hidden"
  whileInView="show"
  viewport={{ once: true }}
>
  {footerColumns.map((col) => (
    <motion.div key={col.title} variants={fadeUp}>
      {/* column content */}
    </motion.div>
  ))}
</motion.div>
```

### 9.3 Footer Link Hover

```tsx
<motion.a
  whileHover={{ x: 2, opacity: 1 }}
  style={{ opacity: 0.55 }}
  transition={{ duration: 0.15 }}
>
  {link.label}
</motion.a>
```

---

## 10. Micro-Interactions Master Table

A complete reference for every interactive element on the page.

| Element                   | `whileHover`                              | `whileTap`    | Transition                      | Status |
| ------------------------- | ----------------------------------------- | ------------- | ------------------------------- | ------ |
| **Watch Now button**      | `scale: 1.04`                             | `scale: 0.96` | `springSnappy`                  | 🔲     |
| **Film Details button**   | `scale: 1.03, bg: rgba(255,255,255,0.12)` | `scale: 0.97` | `springSnappy`                  | 🔲     |
| **Trending card**         | `scale: 1.05, y: -6`                      | `scale: 0.98` | `springGentle`                  | 🔲     |
| **New Arrivals card**     | `scale: 1.05, y: -6`                      | `scale: 0.98` | `springGentle`                  | 🔲     |
| **Featured large card**   | `scale: 1.02`                             | `scale: 0.99` | `springGentle`                  | 🔲     |
| **Right editorial cards** | `x: -3`                                   | `scale: 0.98` | `springGentle`                  | 🔲     |
| **Carousel arrow**        | `scale: 1.12, bg: rgba(255,255,255,0.15)` | `scale: 0.9`  | `springBouncy`                  | 🔲     |
| **Nav links**             | `y: -1, opacity: 1`                       | `y: 0`        | `duration: 0.15`                | ✅     |
| **VIEW ALL link**         | `x: 3`                                    | —             | `duration: 0.2`                 | 🔲     |
| **Footer links**          | `x: 2, opacity: 1`                        | —             | `duration: 0.15`                | 🔲     |
| **User icon**             | `scale: 1.1`                              | `scale: 0.9`  | `springSnappy`                  | ✅     |
| **Search input**          | —                                         | —             | `expand on focus: springGentle` | 🔲     |
| **Quality badge (4K/HD)** | `scale: 1.15`                             | —             | `springBouncy`                  | 🔲     |

---

## 11. Scroll Choreography Map

Reading top-to-bottom, this is the full sequence of animations as the user scrolls through the Browse page. ✅ marks what is live.

```
PAGE LOAD
│
├─ 0ms      ── ✅ Navbar slides down (y: -56 → 0)
├─ 0ms      ── 🔲 Hero backdrop breathes open (scale: 1.06 → 1.0, fade in) · 1400ms
├─ 400ms    ── 🔲 Hero gradient vignette fades in
├─ 550ms    ── 🔲 Badge pills slide in from left
├─ 600ms    ── 🔲 H1 title fades up
├─ 700ms    ── 🔲 Synopsis text fades up
├─ 800ms    ── 🔲 CTA buttons fade up
│
SCROLL ↓
│
├─ §01 heading enters viewport
│   ├─ 🔲 "01" ordinal fades up
│   └─ 🔲 "TRENDING NOW" fades up (+80ms delay)
│
├─ Trending card row enters viewport
│   └─ 🔲 Cards scale-in with 70ms stagger (7 cards = ~490ms total)
│
├─ §02 heading enters viewport
│   ├─ 🔲 "02" ordinal fades up
│   └─ 🔲 "INDIE CINEMA" fades up
│
├─ Featured large card enters viewport
│   └─ 🔲 scale: 0.96 → 1.0, opacity 0 → 1 · 650ms
│
├─ Right stacked cards enter viewport (150ms delay after featured)
│   ├─ 🔲 GOAT card slides in from right · 500ms
│   └─ 🔲 SEND HELP card slides in from right (+120ms) · 500ms
│
├─ §03 heading enters viewport
│   └─ 🔲 "NEW ARRIVALS" fades up
│
├─ 🔲 Carousel arrows pop in (springBouncy)
│
├─ New Arrivals card row enters viewport
│   └─ 🔲 Cards scale-in with 70ms stagger
│
└─ 🔲 Footer fades in softly · 600ms
    └─ 🔲 Footer link columns stagger in · 80ms each
```

---

## 12. Performance Rules

These are **non-negotiable** constraints. Violating them risks janky animations on lower-end devices.

### ✅ Always do this

- **Only animate `opacity` and `transform`** — these are GPU-composited and never trigger layout
- Use **`useScroll` + `useTransform`** for scroll-driven values — avoids React re-renders
- Use **`viewport={{ once: true }}`** on all `whileInView` — animations fire once and stop watching
- Use **`will-change: transform`** on card hover elements (apply via CSS, not Framer Motion)
- Use **`layout` prop only when needed** — `layoutId` for the nav underline only
- Keep stagger totals under **600ms** — beyond that, late cards feel abandoned

### ❌ Never do this

- Never animate `width`, `height`, `padding`, `margin`, `top`, `left`, `right`, `bottom`
- Never put `whileInView` without `viewport={{ once: true }}` — it re-triggers on scroll back
- Never animate more than **10 elements simultaneously** without stagger
- Never use `animate()` imperative API for scroll-driven values (use `useTransform`)
- Never use Framer Motion's `layout` prop on large lists — it is expensive

### Testing Checklist

- [ ] Run Chrome DevTools **Performance** tab — no long tasks during animations
- [ ] Set CPU to **4× throttle** — all transitions must remain fluid on mobile
- [ ] Enable **`prefers-reduced-motion`** in OS — confirm all animations stop
- [ ] Check **Layers panel** in DevTools — animated elements should be on their own composited layer
- [ ] Test on a real Android mid-range device (e.g. Pixel 6a)

---

## 13. Reduced Motion Compliance

All animations are disabled automatically by the `<MotionConfig reducedMotion="user">` wrapper in the root layout.

> ✅ **IMPLEMENTED** — `MotionConfig` is live in `app/layout.tsx`.

For the **scroll-driven navbar background**, which uses `useTransform` instead of Framer Motion's animation system, handle it manually:

```tsx
// ✅ IMPLEMENTED — leave as-is
import { useReducedMotion } from "framer-motion";

export function Navbar() {
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScroll();

  const bgOpacity = useTransform(
    scrollY,
    [0, 100],
    [prefersReduced ? 0.92 : 0, 0.92],
  );
  // ...
}
```

For the **SPOTLIGHT pulse** animation (pending):

```tsx
// 🔲 PENDING — add when implementing §7.4
const prefersReduced = useReducedMotion()

<motion.span
  animate={prefersReduced ? {} : { opacity: [0.6, 1, 0.6] }}
  transition={{ duration: 3, repeat: Infinity }}
>
```

---

## 14. Implementation Order

Work through this list sequentially. ✅ = done, 🔲 = up next.

**Phase 1 — Foundation**

1. ✅ Add `<MotionConfig reducedMotion="user">` + `<AnimatePresence mode="wait">` to root layout
2. ✅ Create `/lib/motion.ts` with all shared variants and spring presets
3. ✅ Create `<PageWrapper>` component and wrap the Browse page

**Phase 2 — Above the Fold** 4. ✅ Navbar entry animation + scroll-driven background (`useScroll` / `useTransform`) 5. ✅ Nav link hover + `layoutId` active underline 6. ✅ Search bar focus expand 7. 🔲 Hero backdrop scale + fade 8. 🔲 Hero gradient vignette 9. 🔲 Hero badge pills 10. 🔲 Hero title/synopsis/CTA stagger sequence 11. 🔲 Hero CTA button micro-interactions 12. 🔲 Hero parallax on scroll

**Phase 3 — Content Rows** 13. 🔲 Section heading stagger (`whileInView`) — apply to all 3 sections at once 14. 🔲 VIEW ALL link hover + entry 15. 🔲 Thumbnail card stagger entry — Trending row 16. 🔲 Thumbnail card hover lift + overlay reveal (shared `FilmCard` component) 17. 🔲 Quality badge pop-in

**Phase 4 — Editorial Grid** 18. 🔲 Featured large card reveal 19. 🔲 Right stacked cards slide-in from right 20. 🔲 SPOTLIGHT / STAFF PICK label pulse

**Phase 5 — Carousel & Footer** 21. 🔲 Carousel arrow pop-in + micro-interaction 22. 🔲 Carousel slide transition (`AnimatePresence` + `custom` direction) 23. 🔲 New Arrivals card stagger 24. 🔲 Footer fade-in + column stagger + link hover

**Phase 6 — QA** 25. 🔲 Full reduced-motion audit 26. 🔲 Performance audit (4× CPU throttle) 27. 🔲 Cross-browser check (Safari requires `-webkit-backdrop-filter` for blur) 28. 🔲 Mobile touch interaction check (hover states should not fire on touch)

---

_Popotube Browse Page Animation PRD · v1.2 · Confidential_
