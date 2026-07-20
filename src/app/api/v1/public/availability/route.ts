import { prisma } from "@/lib/prisma";
import { getFreeProductsForDate } from "@/lib/domain/availability";
import { deriveWindow, fromDateKey, toDateKey } from "@/lib/domain/dates";
import {
  PRODUCT_INCLUDE,
  fail,
  ok,
  serialiseProductCard,
  type ProductRow,
} from "../../_lib/serialise";

/**
 * GET /public/availability?branch_id&event_date[&collection_id]
 * Mode 2 — event date → free dresses (§5).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const branchId = url.searchParams.get("branch_id");
  const eventDateParam = url.searchParams.get("event_date");
  const collectionId = url.searchParams.get("collection_id") ?? undefined;

  if (!branchId || !eventDateParam) {
    return fail(
      422,
      "INVALID_INPUT",
      "branch_id and event_date are both required.",
    );
  }

  const eventDate = fromDateKey(eventDateParam);
  if (!eventDate) {
    return fail(422, "INVALID_INPUT", "event_date must be YYYY-MM-DD.");
  }

  const freeIds = await getFreeProductsForDate({
    branchId,
    eventDate,
    collectionId,
  });

  const products = freeIds.length
    ? await prisma.product.findMany({
        where: { id: { in: freeIds } },
        include: PRODUCT_INCLUDE,
        orderBy: { createdAt: "desc" },
      })
    : [];

  const window = deriveWindow(eventDate);

  return ok({
    branchId,
    eventDate: toDateKey(window.eventDate),
    handoverDate: toDateKey(window.handoverDate),
    takebackDate: toDateKey(window.takebackDate),
    products: products.map((p) => serialiseProductCard(p as ProductRow)),
  });
}
