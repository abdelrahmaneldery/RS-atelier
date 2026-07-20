"use server";

import { ApiError, api } from "@/lib/api/client";

/**
 * Flow A — lead capture (§6).
 *
 * Creates a lead only. No booking, no payment, no dress hold. A note may
 * mention a gown or a date; that is explicitly not a reservation.
 */

export type LeadState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "sent" };

export async function submitLead(
  _prev: LeadState,
  formData: FormData,
): Promise<LeadState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const branchId = String(formData.get("branchId") ?? "").trim() || undefined;
  const productId = String(formData.get("productId") ?? "").trim() || undefined;

  if (name.length < 2) {
    return { status: "error", error: "Enter your full name." };
  }
  if (!phone) {
    return { status: "error", error: "Enter your mobile number." };
  }

  try {
    await api.createLead({ name, phone, note, branchId, productId });
    return { status: "sent" };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", error: error.message };
    }
    throw error;
  }
}
