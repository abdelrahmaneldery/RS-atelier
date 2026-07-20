import { prisma } from "@/lib/prisma";
import { confirmBooking } from "@/lib/domain/booking";
import {
  PRODUCT_INCLUDE,
  fail,
  notFound,
  ok,
  serialiseBooking,
  type BookingRow,
} from "../../../_lib/serialise";

/**
 * POST /bookings/{reference}/confirm — Flow B step 2 (§4).
 *
 * Records the deposit and the ID hold, moving the booking to `confirmed`.
 * The dress stays `Reserved` — only handover in branch changes that.
 *
 * The balance and the insurance are NOT taken here. Those are branch money
 * moments, collected at handover (§4).
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

  const input = body as {
    phone?: string;
    depositAmount?: number;
    depositMethod?: string;
    idFileRef?: string;
    idFileName?: string;
  };

  const result = await confirmBooking({
    reference,
    phone: input.phone ?? "",
    deposit: {
      amount: Number(input.depositAmount ?? 0),
      method: input.depositMethod ?? "",
    },
    idFile: {
      fileRef: input.idFileRef ?? "",
      fileName: input.idFileName,
    },
  });

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
