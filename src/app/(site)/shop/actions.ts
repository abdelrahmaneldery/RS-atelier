"use server";

import { ApiError, api } from "@/lib/api/client";

/**
 * Shop availability lookup.
 *
 * Given the selected branch and an event date, returns the ids of the gowns
 * that are free that night (plus the collect/return dates for that window).
 * Always scoped to the branch the caller passes — fixed server-side, so a
 * customer can never widen it to another branch's stock.
 */
export type ShopAvailability =
  | { ok: true; date: string; handover: string; takeback: string; ids: string[] }
  | { ok: false; error: string };

export async function shopAvailability(
  branchId: string,
  eventDate: string,
): Promise<ShopAvailability> {
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
      ids: data.products.map((p) => p.id),
    };
  } catch (error) {
    if (error instanceof ApiError) return { ok: false, error: error.message };
    return { ok: false, error: "We could not check that date. Please try again." };
  }
}
