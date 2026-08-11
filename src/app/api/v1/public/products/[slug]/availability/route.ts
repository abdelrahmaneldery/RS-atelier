import { getDb } from "@/lib/db";
import {
  getFreeDatesForProduct,
  isProductVisible,
} from "@/lib/domain/availability";
import { fromDateKey } from "@/lib/domain/dates";
import { notFound, ok } from "../../../../_lib/serialise";

/**
 * GET /public/products/{slug}/availability?from&to
 * Mode 1 — dress → free event dates (§5).
 *
 * Advisory only. A date returned here can still be taken before the customer
 * presses Book, in which case create fails with a clash.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const db = getDb();

  const product = db.products.find(
    (p) => p.slug === slug && isProductVisible(p, db),
  );
  if (!product) return notFound("Dress not found.");

  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  const result = getFreeDatesForProduct({
    productId: product.id,
    from: fromParam ? (fromDateKey(fromParam) ?? undefined) : undefined,
    to: toParam ? (fromDateKey(toParam) ?? undefined) : undefined,
  });

  return ok({
    productId: product.id,
    from: result.from,
    to: result.to,
    dates: result.dates,
  });
}
