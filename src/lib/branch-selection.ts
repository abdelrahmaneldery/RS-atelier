import "server-only";

import { cookies } from "next/headers";

import { api } from "./api/client";
import type { ApiBranch } from "./api/contract";

/**
 * The customer's chosen branch.
 *
 * Stored in a cookie rather than localStorage because the whole site filters by
 * branch on the server — the wardrobe, availability and contact details are all
 * rendered server-side, and a client-only store would push that filtering into
 * the browser.
 *
 * Not httpOnly: the value is a public branch slug, not a secret, and the client
 * switcher benefits from being able to read it.
 */

export const BRANCH_COOKIE = "rs_branch";
/** Set when the customer closes the gate without choosing. Session-scoped. */
export const GATE_DISMISSED_COOKIE = "rs_branch_gate";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

export function branchCookieOptions() {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

/**
 * The selected branch, re-validated against the API on every read.
 *
 * A branch that has been unpublished or deactivated since the customer chose it
 * resolves to null, so they are asked again rather than browsing a wardrobe
 * that no longer exists (§11).
 */
export async function getSelectedBranch(): Promise<ApiBranch | null> {
  const store = await cookies();
  const slug = store.get(BRANCH_COOKIE)?.value?.trim();
  if (!slug) return null;

  try {
    return await api.branch(slug);
  } catch {
    return null;
  }
}

/** Just the slug, without a round trip. Use when you only need to compare. */
export async function getSelectedBranchSlug(): Promise<string | null> {
  const store = await cookies();
  return store.get(BRANCH_COOKIE)?.value?.trim() || null;
}

/**
 * Whether the gate was closed without a choice.
 *
 * Kept in a cookie rather than sessionStorage so the server knows it too, and
 * can decide whether to render the modal at all. That is what stops the modal
 * flashing on screen for someone who already dismissed it — and equally stops
 * the page flashing before the modal appears for someone who has not.
 */
export async function isGateDismissed(): Promise<boolean> {
  const store = await cookies();
  return store.get(GATE_DISMISSED_COOKIE)?.value === "1";
}

export { branchDisplayName } from "./branch-name";
