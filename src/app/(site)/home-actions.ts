"use server";

import { ApiError, api } from "@/lib/api/client";
import type { ApiProductCard } from "@/lib/api/contract";

/**
 * Inline "available for your date" lookup on the storefront homepage.
 *
 * Always scoped to the branch the caller passes — which is the selected branch,
 * fixed server-side. A customer can never widen this to another branch's stock.
 */
export type AvailableResult =
  | {
      ok: true;
      date: string;
      handover: string;
      takeback: string;
      products: ApiProductCard[];
    }
  | { ok: false; error: string };

export async function fetchAvailableForDate(
  branchId: string,
  eventDate: string,
): Promise<AvailableResult> {
  if (!branchId || !eventDate) {
    return { ok: false, error: "Choose an event date." };
  }
  try {
    const data = await api.availability({ branchId, eventDate });
    return {
      ok: true,
      date: data.eventDate,
      handover: data.handoverDate,
      takeback: data.takebackDate,
      products: data.products,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "We could not check that date. Please try again." };
  }
}
