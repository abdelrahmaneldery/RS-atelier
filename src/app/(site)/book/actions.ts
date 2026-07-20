"use server";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import { ApiError, api } from "@/lib/api/client";
import { env } from "@/lib/env";
import type { ApiBooking } from "@/lib/api/contract";

/**
 * Flow B — self-book (§6).
 *
 * Create and Confirm are separate server actions so an abandoned flow leaves a
 * truthful `pending` booking rather than a half-written one. Resuming is
 * possible with the reference and phone.
 */

const HOLD_COOKIE = "rs_booking_hold";
const HOLD_TTL_SECONDS = 60 * 60 * 2; // 2 hours

// --- Create ----------------------------------------------------------------

export type CreateState =
  | { status: "idle" }
  | { status: "error"; error: string; recoverable: boolean }
  | { status: "held"; booking: ApiBooking };

export async function createBookingAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const productId = String(formData.get("productId") ?? "");
  const branchId = String(formData.get("branchId") ?? "");
  const eventDate = String(formData.get("eventDate") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (name.length < 2) {
    return { status: "error", error: "Enter your full name.", recoverable: false };
  }
  if (!phone) {
    return { status: "error", error: "Enter your mobile number.", recoverable: false };
  }

  try {
    const booking = await api.createBooking({
      productId,
      branchId,
      eventDate,
      name,
      phone,
    });

    // Lets the customer resume Confirm on refresh without re-entering
    // everything, and without creating a second hold (§11).
    await setHoldCookie(booking.reference);

    return { status: "held", booking };
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        status: "error",
        error: error.message,
        // A clash means "choose again", not "you did something wrong".
        recoverable: error.isClash || error.isNotFound,
      };
    }
    throw error;
  }
}

// --- Confirm ---------------------------------------------------------------

export type ConfirmState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "confirmed"; booking: ApiBooking };

export async function confirmBookingAction(
  _prev: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const reference = String(formData.get("reference") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const depositAmount = Number(formData.get("depositAmount") ?? 0);
  const depositMethod = String(formData.get("depositMethod") ?? "");
  const idFile = formData.get("idFile");

  if (!phone) {
    return { status: "error", error: "Confirm the mobile number you booked with." };
  }
  if (!depositMethod) {
    return { status: "error", error: "Choose how you would like to pay the deposit." };
  }

  // The ID document is required at Confirm (§7). Only a reference to the stored
  // file is sent onward — the document itself is never persisted by this site.
  if (!(idFile instanceof File) || idFile.size === 0) {
    return { status: "error", error: "Upload a photo of your ID to continue." };
  }
  if (idFile.size > 8 * 1024 * 1024) {
    return { status: "error", error: "That file is too large. Please upload an image under 8MB." };
  }
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowed.includes(idFile.type)) {
    return { status: "error", error: "Upload a JPG, PNG, WebP or PDF." };
  }

  try {
    const booking = await api.confirmBooking({
      reference,
      phone,
      depositAmount,
      depositMethod,
      // TODO: replace with the storage service reference once file upload is
      // wired to the backend. The document is deliberately not stored here.
      idFileRef: `pending-upload:${reference}`,
      idFileName: idFile.name,
    });

    await clearHoldCookie();
    return { status: "confirmed", booking };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", error: error.message };
    }
    throw error;
  }
}

// --- Cancel ----------------------------------------------------------------

export type CancelState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "cancelled"; booking: ApiBooking };

export async function cancelBookingAction(
  _prev: CancelState,
  formData: FormData,
): Promise<CancelState> {
  const reference = String(formData.get("reference") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();

  try {
    const booking = await api.cancelBooking({ reference, phone });
    await clearHoldCookie();
    return { status: "cancelled", booking };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", error: error.message };
    }
    throw error;
  }
}

// --- Hold cookie -----------------------------------------------------------

async function setHoldCookie(reference: string) {
  const token = await new SignJWT({ reference })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("rs-atelier")
    .setAudience("booking-hold")
    .setExpirationTime(`${HOLD_TTL_SECONDS}s`)
    .sign(new TextEncoder().encode(env().SESSION_SECRET));

  const store = await cookies();
  store.set(HOLD_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: HOLD_TTL_SECONDS,
  });
}

async function clearHoldCookie() {
  const store = await cookies();
  store.delete(HOLD_COOKIE);
}

/** The reference of a hold created in this browser, if still valid. */
export async function getHeldReference(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(HOLD_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(env().SESSION_SECRET),
      { issuer: "rs-atelier", audience: "booking-hold" },
    );
    return typeof payload.reference === "string" ? payload.reference : null;
  } catch {
    return null;
  }
}
