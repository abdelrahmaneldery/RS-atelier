"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { api } from "@/lib/api/client";
import {
  BRANCH_COOKIE,
  GATE_DISMISSED_COOKIE,
  branchCookieOptions,
} from "@/lib/branch-selection";

/**
 * Choosing a branch scopes the whole site, so the slug is validated against the
 * API before it is stored — a cookie is client-writable and must never be
 * trusted to name a real branch.
 */
export async function selectBranch(
  slug: string,
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const clean = (slug ?? "").trim();
  if (!clean) return { ok: false, error: "Choose a branch to continue." };

  try {
    const branch = await api.branch(clean);
    const store = await cookies();
    store.set(BRANCH_COOKIE, branch.slug, branchCookieOptions());
    // Every page is branch-scoped, so the whole tree is stale.
    revalidatePath("/", "layout");
    return { ok: true, slug: branch.slug };
  } catch {
    return {
      ok: false,
      error: "That branch is not available. Please choose another.",
    };
  }
}

export async function clearBranch(): Promise<void> {
  const store = await cookies();
  store.delete(BRANCH_COOKIE);
  revalidatePath("/", "layout");
}

/**
 * Closes the gate for this browsing session without choosing a branch. A
 * session cookie (no maxAge), so the choice is offered again next visit.
 */
export async function dismissBranchGate(): Promise<void> {
  const store = await cookies();
  store.set(GATE_DISMISSED_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    // Not secure — see branchCookieOptions: a secure cookie is dropped over
    // http, which would re-open the gate on every refresh.
    secure: false,
    path: "/",
  });
}
