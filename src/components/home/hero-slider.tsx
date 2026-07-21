"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { HERO_SLIDES } from "@/config/media";
import { Container } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

/**
 * Full-screen homepage hero slider.
 *
 * The images crossfade behind a fixed headline + CTA — only the background
 * changes, so the text never moves. Slides advance every ~5.5s, pausing while
 * a control is focused or during a touch swipe, and honour
 * `prefers-reduced-motion` (no autoplay, no
 * crossfade). Images come from the shared HERO_SLIDES config, so more can be
 * added by editing one array. The header's transparent-over-hero behaviour is
 * unchanged — it keys off the route and scroll position, not this component.
 */

const AUTOPLAY_MS = 5500;

/** Reduced-motion as an external store, so we never setState inside an effect. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function HeroSlider({ shopHref }: { shopHref: string }) {
  const slides = HERO_SLIDES;
  const count = slides.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const touchX = useRef<number | null>(null);

  const autoplay = count > 1 && !paused && !reducedMotion;

  // Advance on a timer; re-armed whenever the slide changes, so manual
  // navigation resets the interval rather than jumping straight after.
  useEffect(() => {
    if (!autoplay) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [autoplay, index, count]);

  const goTo = (i: number) => setIndex(((i % count) + count) % count);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured looks"
      className="relative -mt-[var(--header-h)] flex min-h-svh items-center justify-center overflow-hidden pt-[var(--header-h)] text-center"
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setPaused(false);
        if (start == null || count < 2) return;
        const dx = (e.changedTouches[0]?.clientX ?? start) - start;
        if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
      }}
    >
      {/* Slides — stacked and crossfaded. First is priority; height is fixed by
          the section, so swapping images never shifts layout. */}
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          aria-hidden={i !== index}
          className={cn(
            "absolute inset-0",
            reducedMotion ? "" : "transition-opacity duration-[1200ms] ease-in-out",
            i === index ? "opacity-100" : "opacity-0",
          )}
        >
          <Image
            src={slide.src}
            alt={i === index ? slide.alt : ""}
            fill
            priority={i === 0}
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: slide.position ?? "center" }}
          />
        </div>
      ))}

      {/* Subtle dark overlay for readable text on every slide. */}
      <div aria-hidden="true" className="absolute inset-0 bg-ink/40" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-ink/45 via-ink/15 to-ink/55"
      />

      {/* Fixed headline + CTA — never moves as the background changes. */}
      <Container className="relative z-10 flex flex-col items-center py-24">
        <h1
          className="max-w-[16ch] text-[2.75rem] leading-[1.05] text-white sm:text-[3.5rem] lg:text-[4.5rem]"
          style={{ textShadow: "0 2px 24px rgb(22 19 15 / 0.5)" }}
        >
          The New Season, One Piece at a Time.
        </h1>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink
            href={shopHref}
            size="lg"
            className="border-white bg-white text-ink hover:border-white/90 hover:bg-white/90"
          >
            Shop the Collection
          </ButtonLink>
        </div>
      </Container>

      {/* Controls — only when there is more than one slide. */}
      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/40 p-2 text-white/85 backdrop-blur-sm transition-colors hover:border-white hover:text-white sm:inline-flex"
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/40 p-2 text-white/85 backdrop-blur-sm transition-colors hover:border-white hover:text-white sm:inline-flex"
          >
            <ChevronRight aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
