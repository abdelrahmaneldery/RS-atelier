import { getDb } from "@/lib/db";
import { isBranchVisible } from "@/lib/domain/availability";
import { notFound, ok } from "../../../_lib/serialise";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const branch = getDb().branches.find(
    (b) => b.slug === slug && isBranchVisible(b),
  );

  // Unpublished mid-session → 404, per §11.
  if (!branch) return notFound("Branch not found.");

  return ok({
    id: branch.id,
    name: branch.name,
    slug: branch.slug,
    country: branch.country,
    location: branch.location,
  });
}
