"use server";

import { ApiError, api } from "@/lib/api/client";
import type { ApiBooking } from "@/lib/api/contract";

/**
 * Booking retrieval and cancellation without an account.
 *
 * Reference + phone. A wrong phone and an unknown reference are indistinguishable,
 * so this cannot be used to discover which references exist.
 */

export type BookingState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "found"; booking: ApiBooking; phone: string }
  | { status: "cancelled"; booking: ApiBooking };

export async function findBookingAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const reference = String(formData.get("reference") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!reference || !phone) {
    return {
      status: "error",
      error: "Enter both your booking reference and your mobile number.",
    };
  }

  try {
    const booking = await api.booking(reference, phone);
    return { status: "found", booking, phone };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", error: error.message };
    }
    throw error;
  }
}

export async function cancelAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const reference = String(formData.get("reference") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  try {
    const booking = await api.cancelBooking({ reference, phone });
    return { status: "cancelled", booking };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", error: error.message };
    }
    throw error;
  }
}
