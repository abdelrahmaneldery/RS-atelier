import type { Metadata } from "next";
import { Phone, MapPin, Clock } from "lucide-react";

import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { whatsappLink } from "@/lib/phone";
import { STORE_LOCATIONS, locationMapsUrl } from "@/config/site";
import { getT } from "@/lib/i18n/server";
import { Container } from "@/components/ui/primitives";
import { SocialLinks } from "@/components/layout/social-links";

export const metadata: Metadata = {
  title: "Contact",
  description: "Visit RS Atelier at one of our branches, or get in touch.",
  alternates: { canonical: "/contact" },
};

export const dynamic = "force-dynamic";

/**
 * Contact — two premium branch cards, each pairing the branch details with an
 * elegant map preview that opens Google Maps. Social profiles sit below; the
 * floating WhatsApp button is provided globally by the layout.
 */
export default async function ContactPage() {
  const [whatsapp, t] = await Promise.all([
    getSetting(SETTING_KEYS.contactWhatsapp),
    getT(),
  ]);

  return (
    <Container className="py-14 lg:py-20">
      <h1 className="font-display text-[2.5rem] leading-tight text-ink sm:text-[3rem]">
        {t("contact.title")}
      </h1>
      <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-stone sm:text-base">
        {t("contact.subtitle")}
      </p>

      <div className="mt-10 flex flex-col gap-8 lg:mt-14">
        {STORE_LOCATIONS.map((loc, i) => (
          <article
            key={loc.label}
            className="grid overflow-hidden border border-line bg-offwhite shadow-subtle lg:grid-cols-2"
          >
            {/* Details */}
            <div className="flex flex-col p-6 sm:p-8 lg:p-10">
              <h2 className="font-display text-2xl text-ink lg:text-[1.75rem]">
                {loc.label}
              </h2>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                <a
                  href={loc.phoneHref}
                  className="inline-flex items-center gap-2 font-sans text-[0.95rem] font-medium tracking-wide text-gold-deep transition-colors hover:text-gold"
                >
                  <Phone aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {loc.phone}
                </a>
                <a
                  href={loc.phoneHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 border border-gold bg-gold px-5 py-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:border-gold-deep hover:bg-gold-deep"
                >
                  <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  {t("contact.callNow")}
                </a>
              </div>

              <p className="mt-7 flex gap-2.5 text-sm leading-relaxed text-graphite">
                <MapPin
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep"
                  strokeWidth={1.75}
                />
                <span>{loc.address}</span>
              </p>

              <p className="mt-5 flex items-center gap-2.5 text-sm text-stone">
                <Clock aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {loc.offDay}
              </p>
            </div>

            {/* Elegant stylized map — decorative only, no real map data. The
                "Open in Maps" button is the only link to the real location. */}
            <div className="relative min-h-[15rem] overflow-hidden border-t border-line bg-sand lg:min-h-0 lg:border-l lg:border-t-0">
              <DecorativeMap variant={i} />

              {/* Location pin + subtle branch-name overlay. */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-11 w-11 drop-shadow-[0_6px_10px_rgba(22,19,15,0.28)]"
                >
                  <path
                    d="M12 2c-3.9 0-7 3.1-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.9-3.1-7-7-7z"
                    fill="#8a6d3a"
                  />
                  <circle cx="12" cy="9" r="2.6" fill="#faf7f2" />
                </svg>
                <span className="mt-2 inline-flex items-center bg-ivory/90 px-3 py-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ink shadow-subtle backdrop-blur-sm">
                  {loc.label}
                </span>
              </div>

              {/* Only real link out — opens Google Maps in a new tab. */}
              <a
                href={locationMapsUrl(loc.address)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${loc.label} in Google Maps`}
                className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 border border-line-strong bg-ivory/90 px-3 py-1.5 font-sans text-[0.625rem] font-medium uppercase tracking-[0.12em] text-ink shadow-subtle backdrop-blur-sm transition-colors hover:border-ink hover:bg-ivory"
              >
                <MapPin aria-hidden="true" className="h-3 w-3" strokeWidth={2} />
                {t("contact.openInMaps")}
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-14">
        <p className="eyebrow">{t("contact.follow")}</p>
        <SocialLinks
          className="-ml-2 mt-3"
          linkClassName="text-graphite hover:text-ink"
          whatsappHref={whatsapp.isUnset ? null : whatsappLink(whatsapp.value)}
        />
      </div>
    </Container>
  );
}

/**
 * A purely decorative, stylized street map in the RS Atelier palette — no real
 * map data, tiles, labels or controls. `variant` mirrors the layout so the two
 * branch cards do not look identical.
 */
function DecorativeMap({ variant = 0 }: { variant?: number }) {
  return (
    <svg
      viewBox="0 0 600 450"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={variant % 2 ? { transform: "scaleX(-1)" } : undefined}
    >
      {/* Ground */}
      <rect width="600" height="450" fill="#f0e9de" />

      {/* Soft "park" and "water" tonal shapes */}
      <rect x="48" y="52" width="150" height="118" rx="12" fill="#e7e0d0" />
      <rect x="430" y="66" width="128" height="92" rx="12" fill="#eee7d8" />
      <path
        d="M0,352 Q160,318 320,352 T600,336 L600,450 L0,450 Z"
        fill="#e6ddcd"
      />

      {/* Faint building blocks */}
      <g fill="#faf7f2" opacity="0.55">
        <rect x="252" y="60" width="62" height="44" rx="4" />
        <rect x="332" y="60" width="72" height="44" rx="4" />
        <rect x="252" y="118" width="62" height="58" rx="4" />
        <rect x="64" y="214" width="82" height="58" rx="4" />
        <rect x="166" y="214" width="60" height="58" rx="4" />
        <rect x="424" y="204" width="92" height="60" rx="4" />
      </g>

      {/* Streets — thin grid */}
      <g stroke="#cfc4b5" strokeWidth="2" opacity="0.5" strokeLinecap="round">
        <line x1="0" y1="120" x2="600" y2="120" />
        <line x1="0" y1="196" x2="600" y2="196" />
        <line x1="0" y1="286" x2="600" y2="286" />
        <line x1="150" y1="0" x2="150" y2="450" />
        <line x1="320" y1="0" x2="320" y2="450" />
        <line x1="410" y1="0" x2="410" y2="450" />
      </g>

      {/* Main avenues — warmer and thicker */}
      <g stroke="#cebfa3" strokeWidth="7" opacity="0.55" strokeLinecap="round">
        <line x1="-20" y1="238" x2="620" y2="212" />
        <line x1="356" y1="-20" x2="392" y2="470" />
      </g>

      {/* A single quiet gold accent road */}
      <line
        x1="0"
        y1="58"
        x2="600"
        y2="96"
        stroke="#c4a978"
        strokeWidth="3"
        opacity="0.4"
        strokeLinecap="round"
      />

      {/* Roundabout */}
      <circle cx="392" cy="224" r="15" fill="none" stroke="#cfc4b5" strokeWidth="3" opacity="0.5" />
    </svg>
  );
}
