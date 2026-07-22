"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import { revealProps } from "@/lib/motion";

/**
 * Fade-up on first entry into the viewport (§32).
 *
 * Reveals once and then stays put — nothing on this site should keep moving as
 * the customer reads. Users who prefer reduced motion get the content
 * immediately, with no transform and nothing ever hidden. Same API as before
 * (children, delay in ms, className); the motion config lives in @/lib/motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} {...revealProps(delay)}>
      {children}
    </motion.div>
  );
}
