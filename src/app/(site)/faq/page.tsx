import type { Metadata } from "next";

import { SETTING_KEYS, getSetting, parseFaq } from "@/lib/settings";
import { getT } from "@/lib/i18n/server";
import {
  BUFFER_WORKING_DAYS,
  HORIZON_DAYS,
  WINDOW_MAX_DAYS,
} from "@/lib/domain/constants";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Common questions about renting from RS Atelier.",
  alternates: { canonical: "/faq" },
};

/**
 * Published FAQ entries come from settings. Below them sit answers derived from
 * the actual business rules in src/lib/domain/constants.ts — those are facts
 * the system enforces, not marketing copy, so they are safe to state.
 */
export default async function FaqPage() {
  const [setting, t] = await Promise.all([
    getSetting(SETTING_KEYS.policyFaq),
    getT(),
  ]);
  const published = parseFaq(setting.value);

  const derived = [
    {
      question: "Can I reserve a dress online?",
      answer:
        "No. The website is for browsing and checking availability. To arrange a rental, contact the store team — they confirm the date and take you through everything in store.",
    },
    {
      question: "How do I check if a dress is free for my date?",
      answer:
        "Open the dress, choose your event date and press Check Availability. Availability is shown for guidance only and is confirmed by the store team.",
    },
    {
      question: "Do I pay anything through the website?",
      answer:
        "No. There are no online payments. Any deposit, balance and refundable insurance are arranged with the store when you collect the gown.",
    },
    {
      question: "Can two people rent the same dress?",
      answer:
        "No. Every gown is a single physical piece, so it can only be worn by one person at a time for any overlapping dates.",
    },
    {
      question: "How far ahead can I check availability?",
      answer: `Up to ${HORIZON_DAYS} days before your event. For anything further ahead, contact the store directly.`,
    },
    {
      question: "When do I collect and return the dress?",
      answer: `You collect the day before your event and return it the day after. A rental cannot run longer than ${WINDOW_MAX_DAYS} days.`,
    },
    {
      question: "Why are some dates unavailable even though nobody is wearing the dress?",
      answer: `After every rental, a gown leaves the wardrobe for ${BUFFER_WORKING_DAYS} working days to be cleaned and checked. Those days are not available.`,
    },
    {
      question: "What does the condition band mean?",
      answer:
        "Every gown shows Excellent, Good or Fair, based on how much repair work it has had over its life. It is there so you know what you are collecting.",
    },
    {
      question: "A date I saw is no longer available. Why?",
      answer:
        "Availability shown while browsing is guidance only, not a hold. The store team confirms final availability when you arrange your rental.",
    },
  ];

  const entries = published.length > 0 ? published : derived;

  return (
    <Container size="narrow" className="py-14 lg:py-20">
      <Eyebrow gold>Help</Eyebrow>
      <SectionHeading
        headingLevel="h1"
        title={t("faq.title")}
        className="mt-5"
      />

      {/* Native disclosure: accessible and keyboard-operable with no JS. */}
      <div className="mt-12 divide-y divide-line border-y border-line">
        {entries.map((entry) => (
          <details key={entry.question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-display text-xl text-ink marker:hidden">
              {entry.question}
              <span
                aria-hidden="true"
                className="mt-1 shrink-0 text-gold transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 max-w-[64ch] text-sm leading-relaxed text-stone">
              {entry.answer}
            </p>
          </details>
        ))}
      </div>

      {published.length === 0 ? (
        <p className="mt-8 text-xs leading-relaxed text-mist">
          These answers describe how renting from RS Atelier works. For questions
          about a specific gown, prices, or anything not covered here, please
          contact the store.
        </p>
      ) : null}

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/shop">Browse the Collection</ButtonLink>
        <ButtonLink href="/contact" variant="secondary">
          Ask a Question
        </ButtonLink>
      </div>
    </Container>
  );
}
