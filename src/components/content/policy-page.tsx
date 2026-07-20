import type { ReactNode } from "react";

import type { SettingValue } from "@/lib/settings";
import { Container, EmptyState, Eyebrow, UnconfirmedNotice } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

/**
 * Shared shell for policy pages.
 *
 * An unpublished policy renders a clear "not yet published" state. It is never
 * filled with placeholder legal text, because a customer acting on invented
 * policy is worse than a customer who knows to ask.
 */
export function PolicyPage({
  title,
  eyebrow = "Policies",
  intro,
  setting,
}: {
  title: string;
  eyebrow?: string;
  intro?: ReactNode;
  setting: SettingValue;
}) {
  const paragraphs = toParagraphs(setting.value);
  const published = !setting.isUnset && paragraphs.length > 0;

  return (
    <Container size="narrow" className="py-14 lg:py-20">
      <Eyebrow gold>{eyebrow}</Eyebrow>
      <h1 className="mt-5 text-[2.25rem] leading-tight sm:text-[3rem]">{title}</h1>

      {intro ? (
        <p className="mt-6 max-w-[58ch] leading-relaxed text-graphite">{intro}</p>
      ) : null}

      {published ? (
        <>
          {setting.isPlaceholder ? (
            <UnconfirmedNotice className="mt-8">
              This text has not yet been confirmed by the atelier and may change.
              Please ask the branch team if anything is unclear.
            </UnconfirmedNotice>
          ) : null}

          <div className="mt-10 space-y-5">
            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="max-w-[68ch] leading-relaxed text-charcoal"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-12">
          <EmptyState
            title="This policy has not been published yet"
            body="The atelier has not published this text. Please ask the branch team when you collect, or get in touch and we will explain it."
            action={
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/contact">Contact Us</ButtonLink>
                <ButtonLink href="/branches" variant="secondary">
                  Browse the Wardrobe
                </ButtonLink>
              </div>
            }
          />
        </div>
      )}
    </Container>
  );
}

/** Splits plain text on blank lines. Never renders HTML from stored content. */
export function toParagraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
