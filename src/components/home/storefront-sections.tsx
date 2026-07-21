import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  Gem,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ASPECT, IMAGE_SIZES, occasionImage } from "@/config/media";
import { OCCASION_CATEGORIES, SERVICE_POINTS } from "@/config/site";
import { AtelierImage } from "@/components/ui/atelier-image";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { HeroSlider } from "@/components/home/hero-slider";

/**
 * Storefront building blocks for the branch homepage.
 *
 * These are compact by design — the customer should reach real product grids
 * with minimal scrolling, so nothing here is a full-viewport landing section.
 */

// --- 3. Compact hero / campaign banner -------------------------------------

export function StorefrontHero({ shopHref }: { shopHref: string }) {
  return <HeroSlider shopHref={shopHref} />;
}

// --- 4. Occasion categories -------------------------------------------------

export function OccasionCategories({ shopHref }: { shopHref: string }) {
  return (
    <section className="py-10 lg:py-16">
      <Container>
        <SectionHead title="Shop by Occasion" href={shopHref} linkLabel="All Gowns" />
        {/* Horizontal scroll rail: cards scroll rather than wrapping into rows. */}
        <ul className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {OCCASION_CATEGORIES.map((cat) => (
            <li
              key={cat.label}
              className="w-[64vw] shrink-0 snap-start sm:w-[40vw] lg:w-[24vw]"
            >
              <Link
                href={shopHref}
                className="group relative block overflow-hidden border border-line"
              >
                {/* Large editorial image dominates the card. */}
                <AtelierImage
                  src={occasionImage(cat.label)}
                  alt={`${cat.label} — modest occasion wear`}
                  colour={cat.colour}
                  aspect={ASPECT.occasion}
                  sizes={IMAGE_SIZES.occasion}
                />
                {/* Dark gradient so the title stays readable near the bottom. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/15 to-transparent transition-opacity duration-500 group-hover:from-ink/85"
                />
                <span className="absolute inset-x-0 bottom-0 p-4 lg:p-6">
                  <span
                    className="font-display text-lg leading-tight text-white lg:text-2xl"
                    style={{ textShadow: "0 2px 14px rgb(22 19 15 / 0.55)" }}
                  >
                    {cat.label}
                  </span>
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
