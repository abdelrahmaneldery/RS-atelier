import Link from "next/link";

import { FOOTER_NAV, SITE } from "@/config/site";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { formatPhone, whatsappLink } from "@/lib/phone";
import { parseOpeningHours } from "@/lib/format";

/**
 * Footer (§16.12).
 *
 * Every contact detail is read from configurable settings. Nothing is
 * hardcoded, and anything not yet configured is simply omitted rather than
 * filled with invented information (§33).
 */
export async function Footer() {
  const [phone, whatsapp, email, openingHours] = await Promise.all([
    getSetting(SETTING_KEYS.contactPhone),
    getSetting(SETTING_KEYS.contactWhatsapp),
    getSetting(SETTING_KEYS.contactEmail),
    getSetting(SETTING_KEYS.contactOpeningHours),
  ]);
  const hours = parseOpeningHours(openingHours.value);

  const hasAnyContact =
    !phone.isUnset || !whatsapp.isUnset || !email.isUnset || hours.length > 0;

  return (
    <footer className="mt-24 border-t border-line-dark bg-ink text-ivory">
      <div className="mx-auto w-full max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-8">
          <div>
            <p className="font-display text-2xl text-ivory">Rawan Samir</p>
            <p className="mt-1 font-sans text-[0.5625rem] font-medium uppercase tracking-[0.42em] text-gold-soft">
              {SITE.tagline}
            </p>
            <p className="mt-6 max-w-[34ch] text-sm leading-relaxed text-ivory/60">
              Curated occasion wear, rented by private appointment. Established{" "}
              {SITE.establishedYear}.
            </p>
          </div>

          {FOOTER_NAV.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.18em] text-gold-soft">
                {group.heading}
              </h2>
              <ul className="mt-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="link-underline inline-flex min-h-11 items-center text-sm text-ivory/70 transition-colors hover:text-ivory"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 border-t border-line-dark pt-10">
          <h2 className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.18em] text-gold-soft">
            Contact
          </h2>

          {hasAnyContact ? (
            <dl className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {!phone.isUnset ? (
                <div>
                  <dt className="text-ivory/45">Phone</dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:+${phone.value}`}
                      className="link-underline text-ivory/85"
                    >
                      {formatPhone(phone.value)}
                    </a>
                  </dd>
                </div>
              ) : null}

              {!whatsapp.isUnset ? (
                <div>
                  <dt className="text-ivory/45">WhatsApp</dt>
                  <dd className="mt-1">
                    <a
                      href={whatsappLink(whatsapp.value) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-underline text-ivory/85"
                    >
                      {formatPhone(whatsapp.value)}
                    </a>
                  </dd>
                </div>
              ) : null}

              {!email.isUnset ? (
                <div>
                  <dt className="text-ivory/45">Email</dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${email.value}`}
                      className="link-underline text-ivory/85"
                    >
                      {email.value}
                    </a>
                  </dd>
                </div>
              ) : null}

              {hours.length > 0 ? (
                <div>
                  <dt className="text-ivory/45">Opening Hours</dt>
                  <dd className="mt-1 space-y-1 text-ivory/85">
                    {hours.map((h) => (
                      <p key={h.label}>
                        <span className="text-ivory/55">{h.label}</span> {h.value}
                      </p>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : (
            /* Nothing is invented — the atelier publishes these in /admin. */
            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-ivory/50">
              Contact details have not been published yet. Please use the
              appointment request form and the atelier team will be in touch.
            </p>
          )}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line-dark pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ivory/40">
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center text-xs text-ivory/50 hover:text-ivory/80"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="inline-flex min-h-11 items-center text-xs text-ivory/50 hover:text-ivory/80"
            >
              Terms
            </Link>
            <Link
              href="/rental-policy"
              className="inline-flex min-h-11 items-center text-xs text-ivory/50 hover:text-ivory/80"
            >
              Rental Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
