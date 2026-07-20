import { prisma } from "@/lib/prisma";
import { createBooking } from "@/lib/domain/booking";
import { fromDateKey } from "@/lib/domain/dates";
import { checkRateLimit, getClientKey, rateLimitMessage } from "@/lib/rate-limit";
import {
  PRODUCT_INCLUDE,
  fail,
  ok,
  serialiseBooking,
  type BookingRow,
} from "../_lib/serialise";

/**
 * POST /bookings — Flow B step 1 (§6).
 *
 * Creates the hold: booking → `pending`, dress → `Reserved`. No money moves.
 * Requests carry no member token, so the status log records `member_id = null`
 * to mark a customer action.
 */
export async function POST(request: Request) {
  const clientKey = await getClientKey();
  const limit = await checkRateLimit("bookingCreate", clientKey);
  if (!limit.allowed) {
    return fail(429, "RATE_LIMITED", rateLimitMessage(limit.retryAfterSeconds));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(422, "INVALID_INPUT", "Invalid request body.");
  }

  const input = body as {
    productId?: string;
    branchId?: string;
    eventDate?: string;
    name?: string;
    phone?: string;
  };

  if (!input.productId || !input.branchId || !input.eventDate) {
    return fail(
      422,
      "INVALID_INPUT",
      "productId, branchId and eventDate are required.",
    );
  }

  const eventDate = fromDateKey(input.eventDate);
  if (!eventDate) {
    return fail(422, "INVALID_INPUT", "eventDate must be YYYY-MM-DD.");
  }

  const result = await createBooking({
    productId: input.productId,
    branchId: input.branchId,
    eventDate,
    customer: { name: input.name ?? "", phone: input.phone ?? "" },
  });

  if (!result.ok) {
    return fail(result.error.status, result.error.code, result.error.message);
  }

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: result.bookingId },
    include: {
      customer: { select: { name: true } },
      product: { include: PRODUCT_INCLUDE },
      payments: { select: { type: true, direction: true } },
      idHold: { select: { id: true, releasedAt: true } },
    },
  });

  return ok(serialiseBooking(booking as BookingRow), { status: 201 });
}
