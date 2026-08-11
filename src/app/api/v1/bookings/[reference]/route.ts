import { getDb } from "@/lib/db";
import { findBookingForCustomer } from "@/lib/domain/booking";
import { checkRateLimit, getClientKey, rateLimitMessage } from "@/lib/rate-limit";
import {
  buildBookingRow,
  fail,
  notFound,
  ok,
  serialiseBooking,
} from "../../_lib/serialise";

/**
 * GET /bookings/{reference}?phone=…
 *
 * A booking is retrieved with its reference AND the phone number it was made
 * with. A wrong phone and an unknown reference return the same 404, so this
 * cannot be used to discover which references exist.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const clientKey = await getClientKey();
  const limit = checkRateLimit("bookingLookup", clientKey);
  if (!limit.allowed) {
    return fail(429, "RATE_LIMITED", rateLimitMessage(limit.retryAfterSeconds));
  }

  const { reference } = await params;
  const url = new URL(request.url);

  const booking = findBookingForCustomer(
    reference,
    url.searchParams.get("phone") ?? "",
  );

  if (!booking) return notFound("We could not find that booking.");

  return ok(serialiseBooking(buildBookingRow(booking, getDb())));
}
