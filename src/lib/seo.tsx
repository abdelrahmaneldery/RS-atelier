import { SITE } from "@/config/site";

/**
 * Canonical origin for absolute URLs (sitemap, robots, structured data).
 * Falls back to localhost in development rather than guessing a domain.
 */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Organisation structured data.
 *
 * Deliberately minimal: no address, telephone or opening hours are emitted,
 * because those are real business facts and are not yet published. Emitting
 * placeholder values here would put unverified information into search results.
 */
export function organisationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: SITE.name,
    alternateName: SITE.shortName,
    description: SITE.description,
    url: siteUrl(),
    foundingDate: String(SITE.establishedYear),
  };
}

/**
 * Product structured data for a dress.
 *
 * `offers` is omitted entirely unless a rental price is actually published —
 * a price of 0 or an invented figure would be worse than no markup at all.
 */
export function productJsonLd(product: {
  name: string;
  slug: string;
  code: string;
  description: string | null;
  price: number | null;
  currency: string;
  imageUrl: string | null;
}) {
  const showPrice = product.price !== null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.code,
    ...(product.description ? { description: product.description } : {}),
    ...(product.imageUrl ? { image: absoluteUrl(product.imageUrl) } : {}),
    url: absoluteUrl(`/dresses/${product.slug}`),
    brand: { "@type": "Brand", name: SITE.shortName },
    ...(showPrice
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: product.currency,
            price: (product.price! / 100).toFixed(2),
            // One-of-one: exactly one unit exists.
            availability: "https://schema.org/InStock",
            inventoryLevel: { "@type": "QuantitativeValue", value: 1 },
            url: absoluteUrl(`/dresses/${product.slug}`),
          },
        }
      : {}),
  };
}

/** Renders JSON-LD. Content is serialised, never interpolated from user input. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Serialised from typed objects we construct; `<` is escaped so the
      // payload cannot terminate the script element early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
