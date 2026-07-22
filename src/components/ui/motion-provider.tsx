"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

import { EASE_QUIET, DUR } from "@/lib/motion";

/**
 * Site-wide motion defaults.
 *
 * `reducedMotion="user"` makes every motion component honour the visitor's
 * system setting automatically — transforms are dropped and only opacity is
 * kept for anyone who asks for reduced motion, so no per-component guard is
 * needed. The default transition matches the house easing and tempo.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: DUR.base, ease: EASE_QUIET }}>
      {children}
    </MotionConfig>
  );
}
