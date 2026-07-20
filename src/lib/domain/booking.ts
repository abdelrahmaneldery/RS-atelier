import "server-only";

import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/crypto";
import { normalizePhone } from "@/lib/phone";
import {
  ACTIVE_BOOKING_STATUSES,
  CANCELLABLE_STATUSES,
  balanceFor,
  depositFor,
  type BookingStatus,
} from "./constants";
import {
  checkWindowGuards,
  deriveWindow,
  intervalsOverlap,
  occupiedInterval,
} from "./dates";
import { visibleProductWhere } from "./availability";

/**
 * Booking creation, confirmation and cancellation (§4, §6 Flow B, §7).
 *
 * The website may only ever drive a booking to `pending`, `confirmed` or
 * `cancelled` (§2 cut line). Handover, takeback and ready are branch-only and
 * are not implemented here at all.
 *
 * Every write re-validates from scratch. Availability the customer saw was
 * advisory; this is where it becomes real.
 */

export type BookingError = {
  code:
    | "PRODUCT_NOT_FOUND"
    | "PRODUCT_UNAVAILABLE"
    | "BRANCH_MISMATCH"
    | "PAST_DATE"
    | "BEYOND_HORIZON"
    | "WINDOW_TOO_LONG"
    | "CLASH"
    | "NO_PRICE"
    | "INVALID_INPUT"
    | "NOT_FOUND"
    | "NOT_CANCELLABLE"
    | "ALREADY_CONFIRMED"
    | "MISSING_DEPOSIT"
    | "MISSING_ID";
  message: string;
  /** HTTP status the API layer should map this to. */
  status: 400 | 404 | 409 | 422;
};

export type CreateBookingInput = {
  productId: string;
  branchId: string;
  eventDate: Date;
  customer: { name: string; phone: string };
};

export type CreateBookingResult =
  | { ok: true; reference: string; bookingId: string }
  | { ok: false; error: BookingError };

/**
 * Stage 1 — Create / hold.
 * Booking → `pending`, dress `Available` → `Reserved`. No money is taken.
 */
export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const name = input.customer.name?.trim();
  if (!name || name.length < 2) {
    return fail("INVALID_INPUT", "Enter your full name.", 422);
  }

  const phone = normalizePhone(input.customer.phone ?? "");
  if (!phone.ok) return fail("INVALID_INPUT", phone.error, 422);

  const window = deriveWindow(input.eventDate);

  // Guards 2 and 3 — cheap, so run before touching the database.
  const guard = checkWindowGuards(window);
  if (guard) return fail(guard.code, guard.message, 422);

  // Guard 1 — the dress must be publicly bookable.
  const product = await prisma.product.findFirst({
    where: { id: input.productId, ...visibleProductWhere() },
    select: {
      id: true,
      branchId: true,
      status: true,
      price: true,
      insuranceAmount: true,
    },
  });

  if (!product) {
    return fail(
      "PRODUCT_NOT_FOUND",
      "This dress is no longer available.",
      404,
    );
  }

  // Guard 5 — the dress must belong to the branch the customer chose.
  if (product.branchId !== input.branchId) {
    return fail(
      "BRANCH_MISMATCH",
      "This dress belongs to a different branch.",
      422,
    );
  }

  if (product.price === null) {
    return fail(
      "NO_PRICE",
      "This dress cannot be booked online yet. Please contact the branch.",
      422,
    );
  }

  const price = product.price;
  const deposit = depositFor(price);
  const balance = balanceFor(price);
  const insuranceAmount = product.insuranceAmount ?? 0;

  const reference = await generateUniqueReference();

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Guard 4 — clash check INSIDE the transaction. The calendar the
      // customer saw was advisory; this is the check that counts.
      const active = await tx.booking.findMany({
        where: {
          productId: product.id,
          status: { in: ACTIVE_BOOKING_STATUSES },
        },
        select: { handoverDate: true, takebackDate: true },
      });

      const wanted = occupiedInterval(window);
      const clash = active.some((b) =>
        intervalsOverlap(wanted, occupiedInterval(b)),
      );
      if (clash) throw new ClashError();

      // A dress that is not in the pool cannot be newly held, even with no
      // overlapping booking (e.g. it is mid-cleaning or with another client).
      const fresh = await tx.product.findUniqueOrThrow({
        where: { id: product.id },
        select: { status: true },
      });
      if (fresh.status !== "Available" && fresh.status !== "Reserved") {
        throw new UnavailableError(fresh.status);
      }

      // Customer records are deduplicated by phone (§6).
      const customer = await tx.customer.upsert({
        where: { normalizedPhone: phone.normalized },
        create: {
          name,
          phone: input.customer.phone.trim(),
          normalizedPhone: phone.normalized,
          source: "website",
        },
        update: { name, phone: input.customer.phone.trim() },
        select: { id: true },
      });

      const created = await tx.booking.create({
        data: {
          reference,
          customerId: customer.id,
          productId: product.id,
          branchId: product.branchId,
          eventDate: window.eventDate,
          handoverDate: window.handoverDate,
          takebackDate: window.takebackDate,
          price,
          deposit,
          balance,
          insuranceAmount,
          status: "pending",
          source: "website",
          statusLogs: {
            create: {
              fromStatus: null,
              toStatus: "pending",
              // Null member id marks a customer action (§6 Flow B).
              memberId: null,
              note: "Booking created from the website.",
            },
          },
        },
        select: { id: true, reference: true },
      });

      // Hold the dress, and count the request (powers the Trending rail).
      await tx.product.update({
        where: { id: product.id },
        data: { status: "Reserved", requestCount: { increment: 1 } },
      });

      return created;
    });

    return { ok: true, reference: booking.reference, bookingId: booking.id };
  } catch (error) {
    if (error instanceof ClashError) {
      return fail(
        "CLASH",
        "This dress was just taken for overlapping dates. Please choose another date or another dress.",
        409,
      );
    }
    if (error instanceof UnavailableError) {
      return fail(
        "PRODUCT_UNAVAILABLE",
        "This dress is no longer available to book.",
        409,
      );
    }
    throw error;
  }
}

export type ConfirmBookingInput = {
  reference: string;
  phone: string;
  deposit: { amount: number; method: string };
  idFile: { fileRef: string; fileName?: string };
};

export type ConfirmBookingResult =
  | { ok: true }
  | { ok: false; error: BookingError };

/**
 * Stage 2 — Confirm.
 * Records the deposit and the ID hold, and moves the booking to `confirmed`.
 * The dress stays `Reserved`; only handover changes that, and only in branch.
 */
export async function confirmBooking(
  input: ConfirmBookingInput,
): Promise<ConfirmBookingResult> {
  const booking = await findBookingForCustomer(input.reference, input.phone);
  if (!booking) {
    return fail("NOT_FOUND", "We could not find that booking.", 404);
  }

  if (booking.status === "confirmed") {
    return fail("ALREADY_CONFIRMED", "This booking is already confirmed.", 422);
  }
  if (booking.status !== "pending") {
    return fail(
      "NOT_CANCELLABLE",
      "This booking can no longer be confirmed online.",
      422,
    );
  }

  if (!input.idFile?.fileRef) {
    return fail("MISSING_ID", "An identity document is required.", 422);
  }
  if (!input.deposit?.method || input.deposit.amount <= 0) {
    return fail("MISSING_DEPOSIT", "A deposit payment is required.", 422);
  }
  // The deposit is server-computed; the client cannot negotiate it down.
  if (input.deposit.amount !== booking.deposit) {
    return fail(
      "MISSING_DEPOSIT",
      "The deposit amount did not match this booking.",
      422,
    );
  }

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        bookingId: booking.id,
        type: "deposit",
        direction: "in",
        amount: booking.deposit,
        method: input.deposit.method,
        // Null marks a customer-initiated (online) payment.
        memberId: null,
      },
    }),
    prisma.idHold.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        fileRef: input.idFile.fileRef,
        fileName: input.idFile.fileName ?? null,
      },
      update: {
        fileRef: input.idFile.fileRef,
        fileName: input.idFile.fileName ?? null,
        releasedAt: null,
      },
    }),
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "confirmed" },
    }),
    prisma.bookingStatusLog.create({
      data: {
        bookingId: booking.id,
        fromStatus: "pending",
        toStatus: "confirmed",
        memberId: null,
        note: "Deposit recorded and identity document submitted online.",
      },
    }),
  ]);

  return { ok: true };
}

export type CancelBookingResult = { ok: true } | { ok: false; error: BookingError };

/**
 * Cancellation (§7). Allowed only before handover. The dress returns to the
 * pool and any ID hold is released.
 *
 * Refunds are deliberately NOT issued here: policy is deposit-forfeit, and
 * money-out belongs to staff and the ledger.
 */
export async function cancelBooking(
  reference: string,
  phone: string,
): Promise<CancelBookingResult> {
  const booking = await findBookingForCustomer(reference, phone);
  if (!booking) {
    return fail("NOT_FOUND", "We could not find that booking.", 404);
  }

  if (!CANCELLABLE_STATUSES.includes(booking.status as BookingStatus)) {
    return fail(
      "NOT_CANCELLABLE",
      booking.status === "handed_over"
        ? "This dress has already been collected and cannot be cancelled. Please return it to the branch."
        : "This booking can no longer be cancelled.",
      422,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "cancelled" },
    });

    await tx.bookingStatusLog.create({
      data: {
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus: "cancelled",
        memberId: null,
        note: "Cancelled by the customer from the website.",
      },
    });

    // Release the ID hold if one was taken at confirm.
    await tx.idHold.updateMany({
      where: { bookingId: booking.id, releasedAt: null },
      data: { releasedAt: new Date() },
    });

    // Return the dress to the pool — but only if nothing else holds it.
    const stillHeld = await tx.booking.count({
      where: {
        productId: booking.productId,
        status: { in: ACTIVE_BOOKING_STATUSES },
        id: { not: booking.id },
      },
    });
    if (stillHeld === 0) {
      await tx.product.update({
        where: { id: booking.productId },
        data: { status: "Available" },
      });
    }
  });

  return { ok: true };
}

/**
 * A booking is retrieved with its reference AND the phone it was made with.
 * Neither alone is sufficient, so a guessed reference exposes nothing.
 */
export async function findBookingForCustomer(reference: string, phone: string) {
  const normalized = normalizePhone(phone ?? "");
  if (!normalized.ok) return null;

  const booking = await prisma.booking.findFirst({
    where: {
      reference: reference.trim().toUpperCase(),
      customer: { normalizedPhone: normalized.normalized },
    },
    select: {
      id: true,
      reference: true,
      status: true,
      deposit: true,
      productId: true,
    },
  });

  return booking;
}

// --- helpers ---------------------------------------------------------------

class ClashError extends Error {}
class UnavailableError extends Error {
  constructor(public productStatus: string) {
    super(productStatus);
  }
}

function fail(
  code: BookingError["code"],
  message: string,
  status: BookingError["status"],
): { ok: false; error: BookingError } {
  return { ok: false, error: { code, message, status } };
}

async function generateUniqueReference(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateReference("RS");
    const existing = await prisma.booking.findUnique({
      where: { reference: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique booking reference.");
}
