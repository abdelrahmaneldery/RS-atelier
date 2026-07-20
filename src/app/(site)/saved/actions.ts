"use server";

import { api } from "@/lib/api/client";
import type { ApiProductCard, ApiProductDetail } from "@/lib/api/contract";

/** Cap: even a determined localStorage never floods the backend. */
const MAX_RESOLVE = 24;

/**
 * The detail schema extends the card schema, so every card field is already
 * present on a detail. Narrow it to the card shape the grid expects.
 */
function toCard(detail: ApiProductDetail): ApiProductCard {
  return {
    id: detail.id,
    code: detail.code,
    slug: detail.slug,
    description: detail.description,
    fabric: detail.fabric,
    colour: detail.colour,
    silhouette: detail.silhouette,
    healthBand: detail.healthBand,
    price: detail.price,
    currency: detail.currency,
    primaryImage: detail.primaryImage,
    branch: detail.branch,
    collection: detail.collection,
  };
}

/**
 * Resolve a list of slugs (from the client-side Recently Viewed store)
 * into product cards. Dedupes, caps at {@link MAX_RESOLVE}, preserves input
 * order, and silently drops any slug that no longer resolves (404 / unpublished
 * / retired).
 */
export async function resolveProducts(
  slugs: string[],
): Promise<ApiProductCard[]> {
  const unique = Array.from(
    new Set(slugs.filter((slug) => typeof slug === "string" && slug.length > 0)),
  ).slice(0, MAX_RESOLVE);

  // Promise.all preserves array order, so the result keeps the input order.
  const resolved = await Promise.all(
    unique.map(async (slug) => {
      try {
        return toCard(await api.product(slug));
      } catch {
        return null;
      }
    }),
  );

  return resolved.filter((card): card is ApiProductCard => card !== null);
}
