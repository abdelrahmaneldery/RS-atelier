import { prisma } from "@/lib/prisma";
import { visibleBranchWhere } from "@/lib/domain/availability";
import { notFound, ok } from "../../../_lib/serialise";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const branch = await prisma.branch.findFirst({
    where: { slug, ...visibleBranchWhere() },
    select: {
      id: true,
      name: true,
      slug: true,
      country: true,
      location: true,
    },
  });

  // Unpublished mid-session → 404, per §11.
  if (!branch) return notFound("Branch not found.");

  return ok(branch);
}
