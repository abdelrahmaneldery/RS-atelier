import { prisma } from "@/lib/prisma";
import {
  visibleBranchWhere,
  visibleProductWhere,
} from "@/lib/domain/availability";
import {
  PRODUCT_INCLUDE,
  notFound,
  ok,
  serialiseProductCard,
  type ProductRow,
} from "../../../../_lib/serialise";

/** GET /public/branches/{slug}/products — cards, optionally by collection. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);

  const branch = await prisma.branch.findFirst({
    where: { slug, ...visibleBranchWhere() },
    select: { id: true },
  });
  if (!branch) return notFound("Branch not found.");

  const collectionId = url.searchParams.get("collection_id");
  const colour = url.searchParams.get("colour");
  const silhouette = url.searchParams.get("silhouette");
  const sort = url.searchParams.get("sort");

  const orderBy =
    sort === "price_asc"
      ? [{ price: "asc" as const }]
      : sort === "price_desc"
        ? [{ price: "desc" as const }]
        : sort === "trending"
          ? [{ requestCount: "desc" as const }, { createdAt: "desc" as const }]
          : [{ createdAt: "desc" as const }];

  const products = await prisma.product.findMany({
    where: {
      ...visibleProductWhere(),
      branchId: branch.id,
      ...(collectionId ? { collectionId } : {}),
      ...(colour ? { colour } : {}),
      ...(silhouette ? { silhouette } : {}),
    },
    include: PRODUCT_INCLUDE,
    orderBy,
  });

  return ok(products.map((p) => serialiseProductCard(p as ProductRow)));
}
