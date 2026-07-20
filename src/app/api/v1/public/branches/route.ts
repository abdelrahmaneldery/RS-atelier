import { prisma } from "@/lib/prisma";
import { visibleBranchWhere } from "@/lib/domain/availability";
import { ok } from "../../_lib/serialise";

/** GET /public/branches — step 1 of every journey (§10). */
export async function GET() {
  const branches = await prisma.branch.findMany({
    where: visibleBranchWhere(),
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      country: true,
      location: true,
    },
  });

  return ok(branches);
}
