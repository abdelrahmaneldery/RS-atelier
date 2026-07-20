import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/seo";
import {
  visibleBranchWhere,
  visibleProductWhere,
} from "@/lib/domain/availability";

/**
 * Sitemap. Only public, indexable pages appear — the booking flow and booking
 * lookup are private to a single customer and are excluded.
 *
 * Reads the database directly rather than via the API client, because this
 * runs at build time when no HTTP origin is guaranteed to be listening.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/branches`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/our-story`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/rental-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cancellation-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/size-guide`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const [branches, products] = await Promise.all([
    prisma.branch.findMany({
      where: visibleBranchWhere(),
      select: { slug: true, updatedAt: true },
    }),
    prisma.product.findMany({
      where: visibleProductWhere(),
      select: { slug: true, updatedAt: true },
    }),
  ]);

  return [
    ...staticRoutes,
    ...branches.map((b) => ({
      url: `${base}/branches/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${base}/dresses/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
