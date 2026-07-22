import type { Variants } from "motion/react";

/**
 * Shared motion language for the whole public site.
 *
 * The brand is quiet luxury, so every motion here is slow, minimal and built
 * only from transform + opacity — no bounce, no spin, no continuous movement.
 * These mirror the CSS tokens in globals.css (`--ease-out-quiet`, the duration
 * scale) so motion and CSS transitions feel like one system. Reduced-motion is
 * honoured at each call site via `useReducedMotion()`.
 */

/** The house easing — a soft, decelerating curve. Matches `--ease-out-quiet`. */
export const EASE_QUIET: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/** Duration scale, in seconds (mirrors the CSS `--duration-*` tokens). */
export const DUR = { quick: 0.18, base: 0.32, slow: 0.6 } as const;

/** Distance for section fade-ups — kept in the gentle 12–20px band. */
export const REVEAL_Y = 16;

/**
 * Props for a once-only fade-up as a section enters the viewport. Spread onto a
 * `motion.*` element. `delay` is in milliseconds to match the old Reveal API.
 */
export function revealProps(delay = 0) {
  return {
    initial: { opacity: 0, y: REVEAL_Y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "0px 0px -8% 0px" } as const,
    transition: { duration: DUR.slow, ease: EASE_QUIET, delay: delay / 1000 },
  };
}

/** Fade-up variants (for staggered lists driven by a parent). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: REVEAL_Y },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE_QUIET } },
};

/** Backdrop / scrim: a plain cross-fade. */
export const overlayFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE_QUIET } },
  exit: { opacity: 0, transition: { duration: DUR.quick, ease: EASE_QUIET } },
};

/** Modal panel: a subtle rise with a whisper of scale. */
export const modalPanel: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.34, ease: EASE_QUIET } },
  exit: { opacity: 0, y: 8, scale: 0.99, transition: { duration: DUR.quick, ease: EASE_QUIET } },
};

/** Drawer sliding in from the right edge. */
export const drawerRight: Variants = {
  hidden: { x: "100%" },
  show: { x: 0, transition: { duration: 0.36, ease: EASE_QUIET } },
  exit: { x: "100%", transition: { duration: DUR.base, ease: EASE_QUIET } },
};

/** Dropdown / popover: a small origin-top settle. */
export const popover: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.quick, ease: EASE_QUIET } },
  exit: { opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.12, ease: EASE_QUIET } },
};
