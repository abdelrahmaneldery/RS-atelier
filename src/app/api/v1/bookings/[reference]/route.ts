import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { checkRateLimit, getClientKey, rateLimitMessage } from "@/lib/rate-limit";
import {
  PRODUCT_INCLUDE,
  fail,
  notFound,
  ok,
  serialiseBooking,
  type BookingRow,
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
  const limit = await checkRateLimit("bookingLookup", clientKey);
  if (!limit.allowed) {
    return fail(429, "RATE_LIMITED", rateLimitMessage(limit.retryAfterSeconds));
  }

  const { reference } = await params;
  const url = new URL(request.url);
  const phone = normalizePhone(url.searchParams.get("phone") ?? "");

  if (!phone.ok) return notFound("We could not find that booking.");

  const booking = await prisma.booking.findFirst({
    where: {
      reference: reference.trim().toUpperCase(),
      customer: { normalizedPhone: phone.normalized },
    },
    include: {
      customer: { select: { name: true } },
      product: { include: PRODUCT_INCLUDE },
      payments: { select: { type: true, direction: true } },
      idHold: { select: { id: true, releasedAt: true } },
    },
  });

  if (!booking) return notFound("We could not find that booking.");

  return ok(serialiseBooking(booking as BookingRow));
}
