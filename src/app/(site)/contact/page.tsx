import type { Metadata } from "next";

import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { getSelectedBranch } from "@/lib/branch-selection";
import { formatPhone, telLink, whatsappLink } from "@/lib/phone";
import { parseOpeningHours } from "@/lib/format";
import { Container, DetailRow, SectionHeading } from "@/components/ui/primitives";
import { LeadForm } from "@/components/booking/lead-form";
import { LeadSection } from "@/components/booking/lead-section";

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
  const [phone, whatsapp, email, hoursSetting, selectedBranch] =
    await Promise.all([
      getSetting(SETTING_KEYS.contactPhone),
      getSetting(SETTING_KEYS.contactWhatsapp),
      getSetting(SETTING_KEYS.contactEmail),
      getSetting(SETTING_KEYS.contactOpeningHours),
      getSelectedBranch(),
    ]);

  const hours = parseOpeningHours(hoursSetting.value);
  const hasDetails =
    !phone.isUnset || !whatsapp.isUnset || !email.isUnset || hours.length > 0;

  return (
    <>
      <Container className="py-14 lg:py-20">
        <SectionHeading
          headingLevel="h1"
          title="Contact"
          lede="Leave your details and the atelier team will call you, or reach us directly."
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
        ) : null}

      </Container>

      <LeadSection
        id="request-a-call"
        title="Request a Call"
        description="Tell us what you are looking for and we will be in touch. This does not reserve a gown."
      >
        <LeadForm branchId={selectedBranch?.id} />
      </LeadSection>
    </>
  );
}
