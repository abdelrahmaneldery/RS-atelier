import { getDb } from "@/lib/db";
import {
  isBranchVisible,
  isProductVisible,
} from "@/lib/domain/availability";
import { notFound, ok } from "../../../../_lib/serialise";

/** GET /public/branches/{slug}/collections — lookbook groups (§10). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const db = getDb();

  const branch = db.branches.find((b) => b.slug === slug && isBranchVisible(b));
  if (!branch) return notFound("Branch not found.");

  const collections = db.collections
    .filter((c) => c.branchId === branch.id && c.published)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Counted only over dresses that are actually visible, so a collection
  // never advertises pieces the customer cannot open.
  return ok(
    collections.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      coverImage: c.coverImage,
      productCount: db.products.filter(
        (p) => p.collectionId === c.id && isProductVisible(p, db),
      ).length,
    })),
  );
}
