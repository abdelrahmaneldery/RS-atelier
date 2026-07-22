"use server";

import { api } from "@/lib/api/client";
import { BRANCH_DIRECTORY } from "@/config/site";

/**
 * Branch-specific availability for a gown design.
 *
 * Each design is physically held at every branch as a separate one-of-one
 * garment (codes share a suffix across branches — B1-0017 ↔ B2-0017). These
 * helpers check the design's garment at EACH branch for a date. Everything here
 * is strictly READ-ONLY: it never holds a gown, creates a booking, or records
 * anything.
 */

type BranchAvailability = {
  slug: string;
  name: string;
  phone: string;
  phoneHref: string;
};

/** The design number that is shared across branches (last part of the code). */
function codeSuffix(code: string): string {
  return code.split("-").pop() ?? code;
}

/** The slug of this design's garment at a given branch, or null if absent. */
async function garmentSlugAt(
  branchSlug: string,
  productSlug: string,
  productBranchSlug: string,
  suffix: string,
): Promise<string | null> {
  if (branchSlug === productBranchSlug) return productSlug;
  try {
    const cards = await api.products(branchSlug);
    return cards.find((c) => codeSuffix(c.code) === suffix)?.slug ?? null;
  } catch {
    return null;
  }
}

/**
 * Union of the design's free event dates across all branches — so the date
 * picker offers every date the piece is available at any branch.
 */
export async function designFreeDates(
  productSlug: string,
  productCode: string,
  productBranchSlug: string,
): Promise<string[]> {
  const suffix = codeSuffix(productCode);
  const dates = new Set<string>();
  for (const branchSlug of Object.keys(BRANCH_DIRECTORY)) {
    const slug = await garmentSlugAt(branchSlug, productSlug, productBranchSlug, suffix);
    if (!slug) continue;
    try {
      for (const d of (await api.productAvailability(slug)).dates) dates.add(d);
    } catch {
      /* ignore a branch we cannot read */
    }
  }
  return [...dates].sort();
}

/**
 * Which branches hold this design free on the chosen date. Returns the branches
 * (name + phone) that are available, or null on error so the caller can fall
 * back. An empty array means the design is not available anywhere that date.
 */
export async function checkBranchAvailability(
  productSlug: string,
  productCode: string,
  productBranchSlug: string,
  date: string,
): Promise<BranchAvailability[] | null> {
  try {
    const suffix = codeSuffix(productCode);
    const available: BranchAvailability[] = [];
    for (const [branchSlug, info] of Object.entries(BRANCH_DIRECTORY)) {
      const slug = await garmentSlugAt(branchSlug, productSlug, productBranchSlug, suffix);
      if (!slug) continue;
      const dates = (await api.productAvailability(slug)).dates;
      if (dates.includes(date)) {
        available.push({ slug: branchSlug, ...info });
      }
    }
    return available;
  } catch {
    return null;
  }
}
