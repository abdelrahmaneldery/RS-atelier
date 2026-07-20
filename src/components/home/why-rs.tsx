import Link from "next/link";
import {
  ArrowRight,
  Award,
  CalendarCheck,
  PersonStanding,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { WHY_RS, type WhyRsIcon } from "@/config/site";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";

/**
 * "Why RS" — a horizontal five-step timeline: numbered nodes on a connecting
 * line, a gold line-icon beneath each, then title, body and a link arrow.
 *
 * On narrow screens the timeline reflows to a vertical rail so it stays legible
 * without horizontal scrolling.
 */

const ICONS: Record<WhyRsIcon, LucideIcon> = {
  "one-of-one": Sparkles,
  reserve: CalendarCheck,
  condition: Search,
  fitting: PersonStanding,
  trusted: Award,
};

export function WhyRs() {
  return (
    <section className="border-y border-line bg-ivory-deep py-16 lg:py-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-16">
          {/* Left rail — heading and intro */}
          <Reveal>
            <div>
              <Eyebrow gold>The Difference</Eyebrow>
              <h2 className="mt-5 rule-gold text-[2.5rem] leading-none text-ink lg:text-[3.25rem]">
                Why RS
              </h2>
              <p className="mt-8 max-w-[34ch] leading-relaxed text-graphite">
                The RS experience is built on five principles that ensure every
                gown is as exceptional as the moment it&rsquo;s made for.
              </p>
            </div>
          </Reveal>

          {/* Timeline */}
          <Reveal delay={80}>
            <ol className="grid gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
              {WHY_RS.map((item, index) => {
                const Icon = ICONS[item.icon];
                const isLast = index === WHY_RS.length - 1;
                return (
                  <li key={item.title} className="relative flex flex-col items-center text-center">
                    {/* Numbered node on the connecting line */}
                    <div className="relative flex w-full items-center justify-center">
                      {/* Connector to the next node (desktop only). */}
                      {!isLast ? (
                        <span
                          aria-hidden="true"
                          className="absolute left-1/2 top-1/2 hidden h-px w-full -translate-y-1/2 bg-gold/35 lg:block"
                        />
                      ) : null}
                      <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-ivory-deep font-sans text-xs font-medium tracking-[0.1em] text-gold-deep">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Dashed drop to the icon */}
                    <span
                      aria-hidden="true"
                      className="mt-2 h-6 border-l border-dashed border-gold/40"
                    />

                    <Icon
                      aria-hidden="true"
                      className="h-8 w-8 text-gold-deep"
                      strokeWidth={1.25}
                    />

                    <h3 className="mt-5 font-display text-xl text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-stone">
                      {item.body}
                    </p>

                    <Link
                      href={item.href}
                      aria-label={`${item.title} — learn more`}
                      className="mt-auto inline-flex h-11 w-11 items-center justify-center pt-5 text-gold-deep transition-colors hover:text-ink"
                    >
                      <ArrowRight aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
