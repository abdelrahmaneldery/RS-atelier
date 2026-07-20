import type { Metadata } from "next";

import { SETTING_KEYS, getSetting, parseFaq } from "@/lib/settings";
import {
  BUFFER_WORKING_DAYS,
  DEPOSIT_PCT,
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
  const setting = await getSetting(SETTING_KEYS.policyFaq);
  const published = parseFaq(setting.value);

  const derived = [
    {
      question: "Do I need an account to book?",
      answer:
        "No. There is no login and no password. You book with your name and mobile number, and open your booking later with its reference and that same number.",
    },
    {
      question: "Can two people rent the same dress?",
      answer:
        "No. Every gown is a single physical piece. Once it is reserved for a set of dates, nobody else can take it for any overlapping dates.",
    },
    {
      question: "How far ahead can I book?",
      answer: `Up to ${HORIZON_DAYS} days before your event. For anything further ahead, contact the branch directly.`,
    },
    {
      question: "When do I collect and return the dress?",
      answer: `You collect the day before your event and return it the day after. A rental cannot run longer than ${WINDOW_MAX_DAYS} days.`,
    },
    {
      question: "How much do I pay online?",
      answer: `A ${Math.round(DEPOSIT_PCT * 100)}% deposit, paid when you confirm. The remaining balance and a refundable insurance amount are paid in branch when you collect.`,
    },
    {
      question: "Why do I need to upload my ID?",
      answer:
        "Your identity document is held from the moment you confirm until you return the gown. It is released when the dress is checked back in, at the same time as your insurance.",
    },
    {
      question: "Why are some dates unavailable even though nobody is wearing the dress?",
      answer: `After every rental, a gown leaves the wardrobe for ${BUFFER_WORKING_DAYS} working days to be cleaned and checked. Those days cannot be booked.`,
    },
    {
      question: "What does the condition band mean?",
      answer:
        "Every gown shows Excellent, Good or Fair, based on how much repair work it has had over its life. It is there so you know what you are collecting.",
    },
    {
      question: "Can I cancel?",
      answer:
        "Yes, any time before you collect. A deposit that has already been paid is not refunded, so confirm only when you are certain.",
    },
    {
      question: "The dress I wanted was taken while I was deciding. Why?",
      answer:
        "Availability shown while browsing is not a hold. A gown is only yours once your booking is created, which is why a date can disappear between looking and booking.",
    },
  ];

  const entries = published.length > 0 ? published : derived;

  return (
    <Container size="narrow" className="py-14 lg:py-20">
      <Eyebrow gold>Help</Eyebrow>
      <SectionHeading
        headingLevel="h1"
        title="Frequently Asked Questions"
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
          These answers describe how the booking system actually works. For
          questions about a specific gown, prices, or anything not covered here,
          please contact the branch.
        </p>
      ) : null}

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/branches">Browse the Wardrobe</ButtonLink>
        <ButtonLink href="/contact" variant="secondary">
          Ask a Question
        </ButtonLink>
      </div>
    </Container>
  );
}
