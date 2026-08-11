import { getDb } from "@/lib/db";
import { cancelBooking } from "@/lib/domain/booking";
import {
  buildBookingRow,
  fail,
  notFound,
  ok,
  serialiseBooking,
} from "../../../_lib/serialise";

/**
 * POST /bookings/{reference}/cancel — §7.
 *
 * Allowed only before handover. The dress returns to the pool and any ID hold
 * is released. No refund is issued: policy is deposit-forfeit, and money-out
 * belongs to staff and the ledger, never to the website.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(422, "INVALID_INPUT", "Invalid request body.");
  }

  const input = body as { phone?: string };

  const result = cancelBooking(reference, input.phone ?? "");
  if (!result.ok) {
    return fail(result.error.status, result.error.code, result.error.message);
  }

  const db = getDb();
  const booking = db.bookings.find(
    (b) => b.reference === reference.trim().toUpperCase(),
  );

  if (!booking) return notFound("We could not find that booking.");

  return ok(serialiseBooking(buildBookingRow(booking, db)));
}
