import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  CalendarCheck,
  Gem,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { EDITORIAL_IMAGES, tintForColour } from "@/config/media";
import { OCCASION_CATEGORIES, SERVICE_POINTS } from "@/config/site";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

/**
 * Storefront building blocks for the branch homepage.
 *
 * These are compact by design — the customer should reach real product grids
 * with minimal scrolling, so nothing here is a full-viewport landing section.
 */

// --- 3. Compact hero / campaign banner -------------------------------------

export function StorefrontHero({ shopHref }: { shopHref: string }) {
  return (
    // Full-viewport and pulled up behind the header, so the transparent bar
    // floats over the image; padded back so the centred content clears it.
    <section className="relative -mt-[var(--header-h)] flex min-h-svh items-center justify-center overflow-hidden pt-[var(--header-h)] text-center">
      <Image
        src={EDITORIAL_IMAGES.hero}
        alt="RS Atelier campaign — a model in a beaded evening gown"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[65%_center]"
      />
      {/* Subtle overlay: enough to carry centred white text, not so much that
          the gown flattens to a silhouette. Slightly stronger in the middle. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-ink/35"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink/40"
      />

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
    </section>
  );
}

// --- 4. Occasion categories -------------------------------------------------

export function OccasionCategories({ shopHref }: { shopHref: string }) {
  return (
    <section className="py-10 lg:py-14">
      <Container>
        <SectionHead title="Shop by Occasion" href={shopHref} linkLabel="All Gowns" />
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {OCCASION_CATEGORIES.map((cat) => (
            <li key={cat.label}>
              <Link
                href={shopHref}
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden border border-line"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                  style={{
                    background: `linear-gradient(160deg, ${tintForColour(cat.colour)} 0%, ${tintForColour(cat.colour)}cc 60%, #16130f 140%)`,
                  }}
                />
                <span className="absolute inset-0 bg-ink/10 transition-colors group-hover:bg-ink/25" />
                <span className="relative z-10 p-3 font-display text-sm leading-tight text-white sm:text-base">
                  {cat.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

// --- 10. Compact service reassurance strip ---------------------------------

const SERVICE_ICONS = [Gem, CalendarCheck, ShieldCheck, Sparkles, BadgeCheck];

export function ServiceStrip() {
  return (
    <section className="border-y border-line bg-ink py-8 text-ivory">
      <Container>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {SERVICE_POINTS.map((point, i) => {
            const Icon = SERVICE_ICONS[i] ?? Gem;
            return (
              <li key={point.title} className="flex flex-col items-center gap-2 text-center">
                <Icon aria-hidden="true" className="h-5 w-5 text-gold-soft" strokeWidth={1.25} />
                <span className="font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ivory">
                  {point.title}
                </span>
                <span className="text-xs leading-relaxed text-ivory/55">
                  {point.body}
                </span>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

// --- shared section header --------------------------------------------------

export function SectionHead({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <Eyebrow gold className="mb-2">{eyebrow}</Eyebrow> : null}
        <h2 className="font-display text-[1.75rem] leading-none text-ink lg:text-[2.25rem]">
          {title}
        </h2>
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="link-underline pb-1 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
