import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

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

export default function RentalPolicyPage() {
  return (
    <Container size="narrow" className="py-14 lg:py-20">
      <h1 className="text-[2.25rem] leading-tight sm:text-[3rem]">Rental Policy</h1>
      <p className="mt-6 max-w-[60ch] leading-relaxed text-graphite">
        Every RS Atelier gown is rented for one customer, one event date, and one
        selected branch.
      </p>

      <div className="mt-12 space-y-10">
        <Section number="01" title="Reservation">
          <p>A gown is reserved only after the booking has been successfully confirmed.</p>
          <p>Each reservation applies to:</p>
          <Bullets items={["One customer", "One gown", "One event date", "One selected branch"]} />
          <p>Availability is checked again when the booking is submitted.</p>
        </Section>

        <Section number="02" title="Fitting and Collection">
          <p>
            The customer must collect the gown from the selected RS Atelier branch
            on the confirmed collection date.
          </p>
          <p>Before leaving the branch, the customer should:</p>
          <Bullets
            items={[
              "Inspect the gown",
              "Confirm the fit",
              "Review its recorded condition",
              "Report any visible issue to the branch team",
            ]}
          />
          <p>Once collected, the customer accepts the gown in its recorded condition.</p>
        </Section>

        <Section number="03" title="Return Period">
          <p>
            The gown must be returned to the same branch on the confirmed return
            date.
          </p>
          <p>
            The return date must be no later than three calendar days after the
            event date.
          </p>
          <p className="border-l-2 border-gold/40 bg-sand/40 px-4 py-3 text-sm">
            <span className="font-medium text-ink">Example:</span> If the event is
            on 20 July, the gown must be returned by 23 July at the latest.
          </p>
          <p>
            Any late-return charges or exceptions must be confirmed by the branch
            team.
          </p>
        </Section>

        <Section number="04" title="Gown Care">
          <p>
            The customer is responsible for keeping the gown safe and in good
            condition during the rental period.
          </p>
          <p>The customer must not:</p>
          <Bullets
            items={[
              "Wash or dry-clean the gown",
              "Iron or steam it without permission",
              "Permanently alter the gown",
              "Cut, stitch, glue, dye, or modify it",
              "Give the gown to another person",
            ]}
          />
          <p>Cleaning and maintenance are handled by RS Atelier.</p>
        </Section>

        <Section number="05" title="Damage or Loss">
          <p>The gown will be inspected after it is returned.</p>
          <p>
            The customer may be responsible for damage beyond normal wear,
            including:
          </p>
          <Bullets
            items={[
              "Tears or burns",
              "Permanent stains",
              "Missing embellishments",
              "Unauthorized alterations",
              "Missing accessories",
              "Loss of the gown",
            ]}
          />
          <p>Any applicable charge will be reviewed manually by the branch team.</p>
        </Section>

        <Section number="06" title="Identification">
          <p>
            A valid identification document may be required to confirm the
            reservation.
          </p>
          <p>
            The identification record remains connected to the booking until the
            gown has been returned and inspected.
          </p>
        </Section>

        <Section number="07" title="Cancellation">
          <p>
            Cancellation and deposit rules are explained in the{" "}
            <Link href="/cancellation-policy" className="link-underline text-ink">
              Cancellation &amp; Refund Policy
            </Link>
            .
          </p>
          <p>
            A confirmed reservation cannot be cancelled through the website after
            the gown has been collected.
          </p>
        </Section>

        <Section number="08" title="Need Assistance?">
          <p>
            For help with collection, returns, gown care, or an existing
            reservation, contact the selected branch and provide:
          </p>
          <Bullets items={["Booking reference", "Customer phone number", "Gown name or code"]} />
        </Section>
      </div>

      {/* Actions */}
      <div className="mt-14 border-t border-line pt-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href="/contact">Contact the Branch</ButtonLink>
          <ButtonLink href="/shop" variant="secondary">
            Browse Dresses
          </ButtonLink>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-mist">
          Rental terms may be updated by RS Atelier. The terms confirmed with your
          reservation apply to that booking.
        </p>
      </div>
    </Container>
  );
}
