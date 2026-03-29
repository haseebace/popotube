**POPOTUBE**

Framer Motion Animation Layer — Product Requirements Document

_Version 1.0 · March 2026 · Next.js 14+ / React 18 / Framer Motion 11_

# **1. Overview & Goals**

This PRD defines the complete Framer Motion animation specification for the Popotube streaming platform. The goal is to add a cinematic, premium feel through subtle, purposeful motion — reinforcing the dark, immersive aesthetic of the product without compromising perceived performance.

**Core animation principles:**

- Invisible when working, noticeable when missing — animations should feel native, not decorative
- Stagger reveals to guide the eye — content enters in a logical reading order
- Respect reduced-motion preferences — all animations must honour prefers-reduced-motion
- 60 fps minimum — all transitions should use GPU-composited properties (opacity, transform only)
- No layout thrash — never animate width, height, or margin

# **2. Technical Requirements**

## **2.1 Dependencies**

- framer-motion@11 (already installed)
- AnimatePresence must wrap all route-level page components
- Use LazyMotion + domAnimation for bundle optimisation in non-critical pages
- Create a shared /lib/motion.ts with all reusable variants

## **2.2 Global Setup**

Wrap the root layout in AnimatePresence with mode='wait' for page transitions:

// app/layout.tsx

<AnimatePresence mode="wait" initial={false}>

{children}

</AnimatePresence>

Create a shared variants file:

// lib/motion.ts

export const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }

export const fadeIn = { hidden: { opacity: 0 }, show: { opacity: 1 } }

export const scaleIn = { hidden: { opacity: 0, scale: 0.96 }, show: { opacity: 1, scale: 1 } }

export const staggerContainer = { show: { transition: { staggerChildren: 0.07 } } }

# **3. Page Transitions**

## **3.1 Entry Animation (Navigate TO watch page)**

The watch page hero should feel like the curtain rising — a slow, confident fade up from slightly below, as if the content is surfacing from darkness.

Implementation:

// components/PageWrapper.tsx

const pageVariants = {

initial: { opacity: 0, y: 16 },

animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },

exit: { opacity: 0, y: -12, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }

}

- Entry duration: 450ms
- Exit duration: 300ms (exits faster than it enters — feels snappy)
- Easing: cubic-bezier(0.25, 0.1, 0.25, 1) for enter / ease-in for exit
- Apply to: every top-level page component via a shared <PageWrapper> motion.div

## **3.2 Exit Animation (Navigate AWAY from watch page)**

When the user clicks Browse/Search/Library, the page should retreat — fade and drift upward slightly, like the scene fading out.

- Opacity: 1 → 0
- Y: 0 → -12px
- Duration: 300ms
- This is handled automatically by AnimatePresence when the page unmounts

# **4. Hero Section Animations**

## **4.1 Background Image**

The hero backdrop should breathe in — a very gentle scale from 1.04 → 1.0 on load, creating a cinematic zoom-out feel, as if the camera is pulling back to reveal the scene.

initial: { scale: 1.04, opacity: 0.6 }

animate: { scale: 1.0, opacity: 1 }

transition: { duration: 1.2, ease: 'easeOut' }

Apply to the <Image> wrapper div, not the image itself.

## **4.2 Gradient Overlay**

The bottom gradient overlay (which creates legibility for the title copy) should fade in slightly delayed after the backdrop:

initial: { opacity: 0 }

animate: { opacity: 1 }

transition: { duration: 0.8, delay: 0.3 }

## **4.3 Title & Metadata Stagger**

The label, title, and tagline should stagger in from below — each element entering 80ms after the previous:

// Parent container

variants={staggerContainer} // staggerChildren: 0.08

// Each child (label, h1, tagline)

variants={fadeUp} // y: 20 → 0, opacity: 0 → 1

transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }

Suggested stagger order: badge label → H1 title → tagline → CTA buttons (delay 0.6s total from page load)

## **4.4 CTA Buttons**

Play and Watchlist buttons should enter together as a unit, slightly after the tagline:

initial: { opacity: 0, y: 16 }

animate: { opacity: 1, y: 0 }

transition: { duration: 0.4, delay: 0.55 }

Hover micro-interaction on Play button:

whileHover: { scale: 1.03 }

whileTap: { scale: 0.97 }

transition: { type: 'spring', stiffness: 400, damping: 25 }

# **5. Metadata Section Animations**

## **5.1 Section Entry**

The metadata grid (Year, Genre, Duration, Rating, Synopsis, Cast) sits below the hero. It should enter when scrolled into view using Framer Motion's whileInView:

whileInView: { opacity: 1, y: 0 }

initial: { opacity: 0, y: 20 }

viewport: { once: true, margin: '-60px' }

transition: { duration: 0.5, ease: 'easeOut' }

## **5.2 Cast List Stagger**

Each cast row should stagger in sequentially:

// Cast list container

variants={{ show: { transition: { staggerChildren: 0.05 } } }}

// Each cast row

variants={fadeUp}

This creates a subtle waterfall effect across the cast column.

# **6. Recommended Row Animations**

## **6.1 Row Header**

The RECOMMENDED heading and subtitle should fade up when the section enters the viewport:

whileInView: { opacity: 1, y: 0 }

initial: { opacity: 0, y: 16 }

viewport: { once: true }

transition: { duration: 0.4 }

## **6.2 Thumbnail Cards — Staggered Entry**

The 5 thumbnail cards should stagger in from slightly below, one by one, as the row enters the viewport:

// Cards container

variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}

whileInView="show" initial="hidden" viewport={{ once: true, margin: '-80px' }}

// Each card

variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}

transition: { duration: 0.4, ease: 'easeOut' }

## **6.3 Card Hover State**

On hover, cards should lift very slightly with a scale and shadow amplification. Do NOT use a scale above 1.04 to maintain the grid layout without triggering reflow:

whileHover: { scale: 1.04, y: -4 }

transition: { type: 'spring', stiffness: 350, damping: 22 }

The image overlay (dark gradient on hover) should be handled with CSS opacity transition, not Framer Motion, for performance.

# **7. Navigation Bar Animations**

## **7.1 Navbar Entry**

The navbar should slide in from the top on initial page load, after a short delay so it does not compete with the hero animation:

initial: { y: -60, opacity: 0 }

animate: { y: 0, opacity: 1 }

transition: { duration: 0.5, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }

## **7.2 Navbar Scroll Behaviour**

On scroll down, the navbar background should transition from transparent to a semi-opaque dark blur. Use useScroll + useTransform for this — not Framer Motion animate, to avoid re-renders:

const { scrollY } = useScroll()

const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.92])

// Apply to navbar wrapper style={{ backgroundColor: `rgba(10,10,20,${bgOpacity})` }}

# **8. Micro-interaction Specification**

All interactive elements should have consistent spring-based press feedback:

| **Component**    | **Animation**   | **Trigger** | **Framer Motion Config**                      |
| ---------------- | --------------- | ----------- | --------------------------------------------- |
| Play Button      | Scale up/down   | Hover / Tap | whileHover:{scale:1.03} whileTap:{scale:0.97} |
| Watchlist Button | Scale + opacity | Hover / Tap | whileHover:{scale:1.02} whileTap:{scale:0.96} |
| Nav Links        | Y shift         | Hover       | whileHover:{y:-1} transition:{duration:0.15}  |
| Thumbnail Cards  | Scale + lift    | Hover       | whileHover:{scale:1.04,y:-4} spring           |
| User Icon        | Scale           | Hover / Tap | whileHover:{scale:1.1} whileTap:{scale:0.9}   |

_All button springs use: stiffness: 400, damping: 25 unless specified otherwise._

# **9. Animation Timing Reference**

All animations on the watch page follow this orchestration sequence from page load:

| **Offset** | **Element**        | **Animation**           | **Duration** |
| ---------- | ------------------ | ----------------------- | ------------ |
| 0ms        | Navbar             | Slide down from top     | 500ms        |
| 0ms        | Hero backdrop      | Scale 1.04→1.0, fade in | 1200ms       |
| 300ms      | Gradient overlay   | Fade in                 | 800ms        |
| 350ms      | Badge / label      | Fade up (y:20→0)        | 500ms        |
| 430ms      | H1 Title           | Fade up (y:20→0)        | 500ms        |
| 510ms      | Tagline            | Fade up (y:20→0)        | 500ms        |
| 600ms      | CTA Buttons        | Fade up (y:16→0)        | 400ms        |
| on scroll  | Metadata grid      | Fade up (whileInView)   | 500ms        |
| on scroll  | Cast rows          | Stagger fade up         | 50ms/item    |
| on scroll  | Recommended header | Fade up (whileInView)   | 400ms        |
| on scroll  | Thumbnail cards    | Stagger fade up         | 60ms/item    |

# **10. Reduced Motion Compliance**

All animations must respect the user's system-level reduced-motion preference. Implement a global hook:

// hooks/useReducedMotion.ts

import { useReducedMotion } from 'framer-motion'

// In each animated component:

const prefersReduced = useReducedMotion()

const transition = prefersReduced ? { duration: 0 } : { duration: 0.45 ... }

Alternatively, set a global Framer Motion config in the root:

<MotionConfig reducedMotion="user">

This is the recommended approach — a single line in the root layout that automatically disables all animations when the OS setting is active.

# **11. Performance Guidelines**

- Only animate opacity and transform — never width, height, padding, margin, or top/left
- Use will-change: transform sparingly — only on elements with persistent hover animations (cards)
- Wrap scroll-based animations in useTransform / useMotionValue instead of animate() to avoid re-renders
- Use viewport={{ once: true }} on all whileInView to avoid re-triggering on scroll back
- Use LazyMotion with domAnimation for pages that do not need drag or layout animations
- Avoid animating more than 8–10 elements simultaneously — use stagger to serialise
- Test on low-end mobile (CPU throttle 4x in DevTools) — all transitions must remain smooth

# **12. Recommended Implementation Order**

Implement in this order to validate the core feel before adding detail:

1. Global setup — AnimatePresence in layout, MotionConfig reducedMotion='user'
2. Page transition wrapper — PageWrapper.tsx with entry/exit variants
3. Hero backdrop animation (scale + fade)
4. Title/CTA stagger sequence
5. Navbar entry + scroll opacity
6. Metadata section whileInView
7. Recommended cards stagger + hover lift
8. Button micro-interactions (whileHover / whileTap)
9. QA on mobile + reduced-motion + CPU throttle

_Popotube Animation PRD · v1.0 · Confidential_
