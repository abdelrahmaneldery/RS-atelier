import type { MetadataRoute } from "next";

import { getDb } from "@/lib/db";
import { siteUrl } from "@/lib/seo";
import { isProductVisible } from "@/lib/domain/availability";

/**
 * Sitemap. Only public, indexable pages appear — the booking flow and booking
 * lookup are private to a single customer and are excluded.
 *
 * Reads the store directly rather than via the API client, because this runs
 * at build time when no HTTP origin is guaranteed to be listening.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/our-story`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/rental-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cancellation-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/size-guide`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const db = getDb();
  const products = db.products.filter((p) => isProductVisible(p, db));

  return [
    ...staticRoutes,
    ...products.map((p) => ({
      url: `${base}/dresses/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
