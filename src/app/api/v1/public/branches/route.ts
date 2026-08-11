import { getDb } from "@/lib/db";
import { isBranchVisible } from "@/lib/domain/availability";
import { ok } from "../../_lib/serialise";

/** GET /public/branches — step 1 of every journey (§10). */
export async function GET() {
  const branches = getDb()
    .branches.filter(isBranchVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      country: b.country,
      location: b.location,
    }));

  return ok(branches);
}
