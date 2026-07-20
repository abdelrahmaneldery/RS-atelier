import { prisma } from "@/lib/prisma";
import { visibleProductWhere } from "@/lib/domain/availability";
import {
  PRODUCT_INCLUDE,
  notFound,
  ok,
  serialiseProductDetail,
  type ProductRow,
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

  const product = await prisma.product.findFirst({
    where: { slug, ...visibleProductWhere() },
    include: PRODUCT_INCLUDE,
  });

  if (!product) return notFound("Dress not found.");

  return ok(serialiseProductDetail(product as ProductRow));
}
