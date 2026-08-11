import "server-only";

import {
  getDb,
  nowIso,
  persistDb,
  uid,
  type BookingRecord,
  type Database,
} from "@/lib/db";
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
import { isProductVisible } from "./availability";

/**
 * Booking creation, confirmation and cancellation (§4, §6 Flow B, §7).
 *
 * The website may only ever drive a booking to `pending`, `confirmed` or
 * `cancelled` (§2 cut line). Handover, takeback and ready are branch-only and
 * are not implemented here at all.
 *
 * Every write re-validates from scratch. Availability the customer saw was
 * advisory; this is where it becomes real. The check-then-write section runs
 * synchronously over the in-memory store, so no other request can interleave
 * with it — the moral equivalent of the old database transaction.
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
export function createBooking(input: CreateBookingInput): CreateBookingResult {
  const name = input.customer.name?.trim();
  if (!name || name.length < 2) {
    return fail("INVALID_INPUT", "Enter your full name.", 422);
  }

  const phone = normalizePhone(input.customer.phone ?? "");
  if (!phone.ok) return fail("INVALID_INPUT", phone.error, 422);

  const window = deriveWindow(input.eventDate);

  // Guards 2 and 3 — cheap, so run before touching the store.
  const guard = checkWindowGuards(window);
  if (guard) return fail(guard.code, guard.message, 422);

  const db = getDb();

  // Guard 1 — the dress must be publicly bookable.
  const product = db.products.find(
    (p) => p.id === input.productId && isProductVisible(p, db),
  );

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

  // Guard 4 — clash check at write time. The calendar the customer saw was
  // advisory; this is the check that counts.
  const active = db.bookings.filter(
    (b) =>
      b.productId === product.id &&
      ACTIVE_BOOKING_STATUSES.includes(b.status as BookingStatus),
  );

  const wanted = occupiedInterval(window);
  const clash = active.some((b) =>
    intervalsOverlap(
      wanted,
      occupiedInterval({
        handoverDate: new Date(b.handoverDate),
        takebackDate: new Date(b.takebackDate),
      }),
    ),
  );
  if (clash) {
    return fail(
      "CLASH",
      "This dress was just taken for overlapping dates. Please choose another date or another dress.",
      409,
    );
  }

  // A dress that is not in the pool cannot be newly held, even with no
  // overlapping booking (e.g. it is mid-cleaning or with another client).
  if (product.status !== "Available" && product.status !== "Reserved") {
    return fail(
      "PRODUCT_UNAVAILABLE",
      "This dress is no longer available to book.",
      409,
    );
  }

  const reference = generateUniqueReference(db);
  const now = nowIso();

  // Customer records are deduplicated by phone (§6).
  const customer = upsertCustomer(db, {
    name,
    phone: input.customer.phone.trim(),
    normalizedPhone: phone.normalized,
  });

  const booking: BookingRecord = {
    id: uid(),
    reference,
    customerId: customer.id,
    productId: product.id,
    branchId: product.branchId,
    eventDate: window.eventDate.toISOString(),
    handoverDate: window.handoverDate.toISOString(),
    takebackDate: window.takebackDate.toISOString(),
    price,
    deposit,
    balance,
    insuranceAmount,
    status: "pending",
    source: "website",
    createdAt: now,
    updatedAt: now,
  };
  db.bookings.push(booking);

  db.bookingStatusLogs.push({
    id: uid(),
    bookingId: booking.id,
    fromStatus: null,
    toStatus: "pending",
    // Null member id marks a customer action (§6 Flow B).
    memberId: null,
    note: "Booking created from the website.",
    createdAt: now,
  });

  // Hold the dress, and count the request (powers the Trending rail).
  product.status = "Reserved";
  product.requestCount += 1;
  product.updatedAt = now;

  persistDb();

  return { ok: true, reference: booking.reference, bookingId: booking.id };
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
export function confirmBooking(
  input: ConfirmBookingInput,
): ConfirmBookingResult {
  const db = getDb();
  const booking = findBookingForCustomer(input.reference, input.phone);
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

  const now = nowIso();

  db.payments.push({
    id: uid(),
    bookingId: booking.id,
    type: "deposit",
    direction: "in",
    amount: booking.deposit,
    method: input.deposit.method,
    // Null marks a customer-initiated (online) payment.
    memberId: null,
    createdAt: now,
  });

  const existingHold = db.idHolds.find((h) => h.bookingId === booking.id);
  if (existingHold) {
    existingHold.fileRef = input.idFile.fileRef;
    existingHold.fileName = input.idFile.fileName ?? null;
    existingHold.releasedAt = null;
  } else {
    db.idHolds.push({
      id: uid(),
      bookingId: booking.id,
      fileRef: input.idFile.fileRef,
      fileName: input.idFile.fileName ?? null,
      releasedAt: null,
      createdAt: now,
    });
  }

  booking.status = "confirmed";
  booking.updatedAt = now;

  db.bookingStatusLogs.push({
    id: uid(),
    bookingId: booking.id,
    fromStatus: "pending",
    toStatus: "confirmed",
    memberId: null,
    note: "Deposit recorded and identity document submitted online.",
    createdAt: now,
  });

  persistDb();

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
export function cancelBooking(
  reference: string,
  phone: string,
): CancelBookingResult {
  const db = getDb();
  const booking = findBookingForCustomer(reference, phone);
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

  const now = nowIso();
  const fromStatus = booking.status;

  booking.status = "cancelled";
  booking.updatedAt = now;

  db.bookingStatusLogs.push({
    id: uid(),
    bookingId: booking.id,
    fromStatus,
    toStatus: "cancelled",
    memberId: null,
    note: "Cancelled by the customer from the website.",
    createdAt: now,
  });

  // Release the ID hold if one was taken at confirm.
  for (const hold of db.idHolds) {
    if (hold.bookingId === booking.id && hold.releasedAt === null) {
      hold.releasedAt = now;
    }
  }

  // Return the dress to the pool — but only if nothing else holds it.
  const stillHeld = db.bookings.some(
    (b) =>
      b.productId === booking.productId &&
      b.id !== booking.id &&
      ACTIVE_BOOKING_STATUSES.includes(b.status as BookingStatus),
  );
  if (!stillHeld) {
    const product = db.products.find((p) => p.id === booking.productId);
    if (product) {
      product.status = "Available";
      product.updatedAt = now;
    }
  }

  persistDb();

  return { ok: true };
}

/**
 * A booking is retrieved with its reference AND the phone it was made with.
 * Neither alone is sufficient, so a guessed reference exposes nothing.
 */
export function findBookingForCustomer(
  reference: string,
  phone: string,
): BookingRecord | null {
  const normalized = normalizePhone(phone ?? "");
  if (!normalized.ok) return null;

  const db = getDb();
  const customer = db.customers.find(
    (c) => c.normalizedPhone === normalized.normalized,
  );
  if (!customer) return null;

  return (
    db.bookings.find(
      (b) =>
        b.reference === reference.trim().toUpperCase() &&
        b.customerId === customer.id,
    ) ?? null
  );
}

/** Customer records are deduplicated by normalized phone (§6). */
export function upsertCustomer(
  db: Database,
  data: { name: string; phone: string; normalizedPhone: string },
) {
  const existing = db.customers.find(
    (c) => c.normalizedPhone === data.normalizedPhone,
  );
  const now = nowIso();
  if (existing) {
    existing.name = data.name;
    existing.phone = data.phone;
    existing.updatedAt = now;
    return existing;
  }
  const customer = {
    id: uid(),
    name: data.name,
    phone: data.phone,
    normalizedPhone: data.normalizedPhone,
    source: "website",
    createdAt: now,
    updatedAt: now,
  };
  db.customers.push(customer);
  return customer;
}

// --- helpers ---------------------------------------------------------------

function fail(
  code: BookingError["code"],
  message: string,
  status: BookingError["status"],
): { ok: false; error: BookingError } {
  return { ok: false, error: { code, message, status } };
}

function generateUniqueReference(db: Database): string {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateReference("RS");
    if (!db.bookings.some((b) => b.reference === candidate)) return candidate;
  }
  throw new Error("Could not generate a unique booking reference.");
}
