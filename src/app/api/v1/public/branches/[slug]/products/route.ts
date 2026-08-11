import { getDb, type ProductRecord } from "@/lib/db";
import {
  isBranchVisible,
  isProductVisible,
} from "@/lib/domain/availability";
import {
  buildProductRow,
  notFound,
  ok,
  serialiseProductCard,
} from "../../../../_lib/serialise";

/** GET /public/branches/{slug}/products — cards, optionally by collection. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const db = getDb();

  const branch = db.branches.find((b) => b.slug === slug && isBranchVisible(b));
  if (!branch) return notFound("Branch not found.");

  const collectionId = url.searchParams.get("collection_id");
  const colour = url.searchParams.get("colour");
  const silhouette = url.searchParams.get("silhouette");
  const sort = url.searchParams.get("sort");

  const compare: (a: ProductRecord, b: ProductRecord) => number =
    sort === "price_asc"
      ? (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)
      : sort === "price_desc"
        ? (a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity)
        : sort === "trending"
          ? (a, b) =>
              b.requestCount - a.requestCount ||
              b.createdAt.localeCompare(a.createdAt)
          : (a, b) => b.createdAt.localeCompare(a.createdAt);

  const products = db.products
    .filter(
      (p) =>
        isProductVisible(p, db) &&
        p.branchId === branch.id &&
        (!collectionId || p.collectionId === collectionId) &&
        (!colour || p.colour === colour) &&
        (!silhouette || p.silhouette === silhouette),
    )
    .sort(compare);

  return ok(products.map((p) => serialiseProductCard(buildProductRow(p, db))));
}
