import { getDb } from "@/lib/db";
import { isProductVisible } from "@/lib/domain/availability";
import {
  buildProductRow,
  notFound,
  ok,
  serialiseProductDetail,
} from "../../../_lib/serialise";

/**
 * GET /public/products/{slug} — detail + images.
 *
 * Unpublished, retired, image-less, or belonging to a hidden branch or
 * collection all resolve to 404 (§8).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const db = getDb();

  const product = db.products.find(
    (p) => p.slug === slug && isProductVisible(p, db),
  );

  if (!product) return notFound("Dress not found.");

  return ok(serialiseProductDetail(buildProductRow(product, db)));
}
