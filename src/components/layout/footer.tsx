import Link from "next/link";

import { SITE } from "@/config/site";
import { Logo } from "@/components/layout/logo";
import { SocialLinks } from "@/components/layout/social-links";
import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { getT } from "@/lib/i18n/server";
import { whatsappLink } from "@/lib/phone";

/**
 * Footer. Contact details live on the Contact page; the footer keeps the brand,
 * navigation, social profiles and the legal row.
 */
export async function Footer() {
  const [whatsapp, t] = await Promise.all([
    getSetting(SETTING_KEYS.contactWhatsapp),
    getT(),
  ]);

  const groups = [
    {
      heading: t("footer.explore"),
      links: [
        { label: t("footer.shop"), href: "/shop" },
        { label: t("footer.ourStory"), href: "/our-story" },
      ],
    },
    {
      heading: t("footer.policies"),
      links: [
        { label: t("footer.rentalPolicy"), href: "/rental-policy" },
        { label: t("footer.cancellationPolicy"), href: "/cancellation-policy" },
      ],
    },
    {
      heading: t("footer.help"),
      links: [
        { label: t("footer.faq"), href: "/faq" },
        { label: t("footer.sizeGuide"), href: "/size-guide" },
        { label: t("footer.contactUs"), href: "/contact" },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-line-dark bg-ink text-ivory">
      <div className="mx-auto w-full max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-8">
          <div>
            <Logo onDark />
            <p className="mt-6 max-w-[34ch] text-sm leading-relaxed text-ivory/60">
              {t("footer.tagline", { year: SITE.establishedYear })}
            </p>
            <SocialLinks
              className="-ml-2 mt-5"
              linkClassName="text-ivory/60 hover:text-ivory"
              whatsappHref={whatsapp.isUnset ? null : whatsappLink(whatsapp.value)}
            />
          </div>

          {groups.map((group) => (
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
            © {new Date().getFullYear()} {SITE.name}. {t("footer.rights")}
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center text-xs text-ivory/50 hover:text-ivory/80"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              href="/terms"
              className="inline-flex min-h-11 items-center text-xs text-ivory/50 hover:text-ivory/80"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href="/rental-policy"
              className="inline-flex min-h-11 items-center text-xs text-ivory/50 hover:text-ivory/80"
            >
              {t("footer.rentalPolicy")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
