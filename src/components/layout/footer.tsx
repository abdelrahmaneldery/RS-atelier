import Link from "next/link";

import { FOOTER_NAV, SITE } from "@/config/site";
import { Logo } from "@/components/layout/logo";
import { SocialLinks } from "@/components/layout/social-links";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { whatsappLink } from "@/lib/phone";

/**
 * Footer. Contact details live on the Contact page; the footer keeps the brand,
 * navigation, social profiles and the legal row.
 */
export async function Footer() {
  const whatsapp = await getSetting(SETTING_KEYS.contactWhatsapp);

  return (
    <footer className="mt-24 border-t border-line-dark bg-ink text-ivory">
      <div className="mx-auto w-full max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-8">
          <div>
            <Logo onDark />
            <p className="mt-6 max-w-[34ch] text-sm leading-relaxed text-ivory/60">
              Curated occasion wear, rented by private appointment. Established{" "}
              {SITE.establishedYear}.
            </p>
            <SocialLinks
              className="-ml-2 mt-5"
              linkClassName="text-ivory/60 hover:text-ivory"
              whatsappHref={whatsapp.isUnset ? null : whatsappLink(whatsapp.value)}
            />
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
