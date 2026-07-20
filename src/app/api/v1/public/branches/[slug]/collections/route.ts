import { prisma } from "@/lib/prisma";
import {
  visibleBranchWhere,
  visibleProductWhere,
} from "@/lib/domain/availability";
import { notFound, ok } from "../../../../_lib/serialise";

/** GET /public/branches/{slug}/collections — lookbook groups (§10). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const branch = await prisma.branch.findFirst({
    where: { slug, ...visibleBranchWhere() },
    select: { id: true },
  });
  if (!branch) return notFound("Branch not found.");

  const collections = await prisma.collection.findMany({
    where: { branchId: branch.id, published: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      coverImage: true,
    },
  });

  // Counted separately, and only over dresses that are actually visible, so a
  // collection never advertises pieces the customer cannot open.
  const counts = await prisma.product.groupBy({
    by: ["collectionId"],
    where: {
      ...visibleProductWhere(),
      branchId: branch.id,
      collectionId: { in: collections.map((c) => c.id) },
    },
    _count: { _all: true },
  });

  const countByCollection = new Map(
    counts.map((row) => [row.collectionId, row._count._all]),
  );

  return ok(
    collections.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      coverImage: c.coverImage,
      productCount: countByCollection.get(c.id) ?? 0,
    })),
  );
}
