import { prisma } from "@/lib/prisma";
import { cancelBooking } from "@/lib/domain/booking";
import {
  PRODUCT_INCLUDE,
  fail,
  notFound,
  ok,
  serialiseBooking,
  type BookingRow,
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

  const result = await cancelBooking(reference, input.phone ?? "");
  if (!result.ok) {
    return fail(result.error.status, result.error.code, result.error.message);
  }

  const booking = await prisma.booking.findFirst({
    where: { reference: reference.trim().toUpperCase() },
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
