import type { Metadata } from "next";

import { api } from "@/lib/api/client";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { getSelectedBranch } from "@/lib/branch-selection";
import { formatPhone, telLink, whatsappLink } from "@/lib/phone";
import { parseOpeningHours } from "@/lib/format";
import { Container, DetailRow, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { LeadForm } from "@/components/booking/lead-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with RS Atelier.",
  alternates: { canonical: "/contact" },
};

export const dynamic = "force-dynamic";

/**
 * Contact details come from configurable settings. Anything unset is omitted
 * rather than invented — the lead form is always offered so the customer
 * always has a route to a person.
 */
export default async function ContactPage() {
  const [phone, whatsapp, email, hoursSetting, allBranches, selectedBranch] =
    await Promise.all([
      getSetting(SETTING_KEYS.contactPhone),
      getSetting(SETTING_KEYS.contactWhatsapp),
      getSetting(SETTING_KEYS.contactEmail),
      getSetting(SETTING_KEYS.contactOpeningHours),
      api.branches().catch(() => []),
      getSelectedBranch(),
    ]);

  // Scoped to the branch being explored, so contact details match the wardrobe
  // the customer is looking at rather than listing every location.
  const branches = selectedBranch
    ? allBranches.filter((b) => b.slug === selectedBranch.slug)
    : allBranches;

  const hours = parseOpeningHours(hoursSetting.value);
  const hasDetails =
    !phone.isUnset || !whatsapp.isUnset || !email.isUnset || hours.length > 0;

  return (
    <>
      <Container size="narrow" className="py-14 lg:py-20">
        <Eyebrow gold>Get in Touch</Eyebrow>
        <SectionHeading
          headingLevel="h1"
          title="Contact"
          lede="Leave your details and the atelier team will call you, or reach us directly."
          className="mt-5"
        />

        {hasDetails ? (
          <dl className="mt-12">
            {!phone.isUnset ? (
              <DetailRow label="Phone">
                <a href={telLink(phone.value) ?? "#"} className="link-underline">
                  {formatPhone(phone.value)}
                </a>
              </DetailRow>
            ) : null}
            {!whatsapp.isUnset ? (
              <DetailRow label="WhatsApp">
                <a
                  href={whatsappLink(whatsapp.value) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline"
                >
                  {formatPhone(whatsapp.value)}
                </a>
              </DetailRow>
            ) : null}
            {!email.isUnset ? (
              <DetailRow label="Email">
                <a href={`mailto:${email.value}`} className="link-underline">
                  {email.value}
                </a>
              </DetailRow>
            ) : null}
            {hours.length > 0 ? (
              <DetailRow label="Opening Hours">
                <div className="space-y-1">
                  {hours.map((h) => (
                    <p key={h.label}>
                      <span className="text-stone">{h.label}</span> {h.value}
                    </p>
                  ))}
                </div>
              </DetailRow>
            ) : null}
          </dl>
        ) : (
          <p className="mt-10 border-l-2 border-line-strong bg-offwhite px-5 py-4 text-sm leading-relaxed text-graphite">
            Our direct contact details have not been published yet. Leave your
            details below and the team will get back to you.
          </p>
        )}

        {branches.length > 0 ? (
          <section className="mt-14 border-t border-line pt-10">
            <h2 className="font-display text-2xl text-ink">
              {selectedBranch ? "Your Branch" : "Our Branches"}
            </h2>
            <ul className="mt-5 space-y-2">
              {branches.map((branch) => (
                <li key={branch.id}>
                  <a
                    href={`/branches/${branch.slug}`}
                    className="link-underline text-sm text-charcoal"
                  >
                    {branch.name}
                  </a>
                  {branch.location ? (
                    <span className="text-mist"> — {branch.location}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Container>

      <section className="border-t border-line bg-ivory-deep py-14">
        <Container size="narrow">
          <h2 className="font-display text-2xl text-ink">Request a Call</h2>
          <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-stone">
            Tell us what you are looking for and we will be in touch. This does
            not reserve a gown.
          </p>
          <div className="mt-8">
            <LeadForm branchId={selectedBranch?.id} />
          </div>

          <div className="mt-12 border-t border-line pt-8">
            <p className="text-sm text-stone">
              Already have a booking?{" "}
              <ButtonLink href="/booking" variant="ghost" size="sm">
                Open It Here
              </ButtonLink>
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
