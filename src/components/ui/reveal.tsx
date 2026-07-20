"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Fade-up on first entry into the viewport (§32).
 *
 * Reveals once and then stops observing — nothing on this site should keep
 * moving as the customer reads. Users who prefer reduced motion see the content
 * immediately: the transition is neutralised in globals.css, and the observer
 * is skipped entirely so nothing is ever hidden from them.
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
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Reduced motion is handled entirely in CSS: globals.css forces .reveal to
    // full opacity under prefers-reduced-motion, so there is nothing to observe
    // and nothing to reveal. Bailing out here keeps content visible either way.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", visible && "reveal-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
