import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { getT } from "@/lib/i18n/server";
import { Container } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Rental Policy",
  description:
    "The terms under which RS Atelier rents its occasion wear — reservation, collection, returns, care, and more.",
  alternates: { canonical: "/rental-policy" },
};

/** One numbered, scannable policy section. */
function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line pt-8">
      <div className="flex items-baseline gap-4">
        <span className="shrink-0 font-sans text-sm font-medium tracking-[0.14em] text-gold-deep">
          {number}
        </span>
        <h2 className="font-display text-2xl leading-tight text-ink">{title}</h2>
      </div>
      <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-charcoal">
        {children}
      </div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-gold-deep">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default async function RentalPolicyPage() {
  const t = await getT();

  return (
    <Container size="narrow" className="py-14 lg:py-20">
      <h1 className="text-[2.25rem] leading-tight sm:text-[3rem]">
        {t("rentalPolicy.title")}
      </h1>
      <p className="mt-6 max-w-[60ch] leading-relaxed text-graphite">
        {t("rentalPolicy.intro")}
      </p>

      <div className="mt-12 space-y-10">
        <Section number="01" title={t("rentalPolicy.reservation")}>
          <p>{t("rentalPolicy.s01p1")}</p>
          <p>{t("rentalPolicy.s01p2")}</p>
          <Bullets
            items={[
              t("rentalPolicy.s01b1"),
              t("rentalPolicy.s01b2"),
              t("rentalPolicy.s01b3"),
            ]}
          />
          <p>{t("rentalPolicy.s01p3")}</p>
        </Section>

        <Section number="02" title={t("rentalPolicy.fittingCollection")}>
          <p>{t("rentalPolicy.s02p1")}</p>
          <p>{t("rentalPolicy.s02p2")}</p>
          <Bullets
            items={[
              t("rentalPolicy.s02b1"),
              t("rentalPolicy.s02b2"),
              t("rentalPolicy.s02b3"),
              t("rentalPolicy.s02b4"),
            ]}
          />
          <p>{t("rentalPolicy.s02p3")}</p>
        </Section>

        <Section number="03" title={t("rentalPolicy.returnPeriod")}>
          <p>{t("rentalPolicy.s03p1")}</p>
          <p>{t("rentalPolicy.s03p2")}</p>
          <p className="border-l-2 border-gold/40 bg-sand/40 px-4 py-3 text-sm">
            <span className="font-medium text-ink">
              {t("rentalPolicy.exampleLabel")}
            </span>{" "}
            {t("rentalPolicy.s03example")}
          </p>
          <p>{t("rentalPolicy.s03p3")}</p>
        </Section>

        <Section number="04" title={t("rentalPolicy.gownCare")}>
          <p>{t("rentalPolicy.s04p1")}</p>
          <p>{t("rentalPolicy.s04p2")}</p>
          <Bullets
            items={[
              t("rentalPolicy.s04b1"),
              t("rentalPolicy.s04b2"),
              t("rentalPolicy.s04b3"),
              t("rentalPolicy.s04b4"),
              t("rentalPolicy.s04b5"),
            ]}
          />
          <p>{t("rentalPolicy.s04p3")}</p>
        </Section>

        <Section number="05" title={t("rentalPolicy.damageLoss")}>
          <p>{t("rentalPolicy.s05p1")}</p>
          <p>{t("rentalPolicy.s05p2")}</p>
          <Bullets
            items={[
              t("rentalPolicy.s05b1"),
              t("rentalPolicy.s05b2"),
              t("rentalPolicy.s05b3"),
              t("rentalPolicy.s05b4"),
              t("rentalPolicy.s05b5"),
              t("rentalPolicy.s05b6"),
            ]}
          />
          <p>{t("rentalPolicy.s05p3")}</p>
        </Section>

        <Section number="06" title={t("rentalPolicy.identification")}>
          <p>{t("rentalPolicy.s06p1")}</p>
          <p>{t("rentalPolicy.s06p2")}</p>
        </Section>

        <Section number="07" title={t("rentalPolicy.cancellation")}>
          <p>
            {t("rentalPolicy.s07p1a")}
            <Link href="/cancellation-policy" className="link-underline text-ink">
              {t("rentalPolicy.s07link")}
            </Link>
            .
          </p>
          <p>{t("rentalPolicy.s07p2")}</p>
        </Section>

        <Section number="08" title={t("rentalPolicy.needAssistance")}>
          <p>{t("rentalPolicy.s08p1")}</p>
          <Bullets
            items={[
              t("rentalPolicy.s08b1"),
              t("rentalPolicy.s08b2"),
              t("rentalPolicy.s08b3"),
            ]}
          />
        </Section>
      </div>

      {/* Actions */}
      <div className="mt-14 border-t border-line pt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/contact">{t("rentalPolicy.contactStore")}</ButtonLink>
          <ButtonLink href="/shop" variant="secondary">
            {t("rentalPolicy.browseDresses")}
          </ButtonLink>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-mist">
          {t("rentalPolicy.disclaimer")}
        </p>
      </div>
    </Container>
  );
}
