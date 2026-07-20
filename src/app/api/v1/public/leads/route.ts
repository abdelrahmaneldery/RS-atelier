import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { checkRateLimit, getClientKey, rateLimitMessage } from "@/lib/rate-limit";
import { fail, ok } from "../../_lib/serialise";

/**
 * POST /public/leads — Flow A (§6).
 *
 * Captures interest only. It creates no booking, takes no payment, and holds
 * no dress. A note may mention a dress or a date; that is not a reservation.
 *
 * An existing phone number is a success, not an error (§11) — the customer is
 * deduplicated rather than rejected.
 */
export async function POST(request: Request) {
  const clientKey = await getClientKey();
  const limit = await checkRateLimit("leadSubmit", clientKey);
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
    name?: string;
    phone?: string;
    note?: string;
    branchId?: string;
    productId?: string;
  };

  const name = input.name?.trim();
  if (!name || name.length < 2) {
    return fail(422, "INVALID_INPUT", "Enter your full name.");
  }

  const phone = normalizePhone(input.phone ?? "");
  if (!phone.ok) return fail(422, "INVALID_INPUT", phone.error);

  const existing = await prisma.customer.findUnique({
    where: { normalizedPhone: phone.normalized },
    select: { id: true },
  });

  const customer = await prisma.customer.upsert({
    where: { normalizedPhone: phone.normalized },
    create: {
      name,
      phone: input.phone!.trim(),
      normalizedPhone: phone.normalized,
      source: "website",
    },
    update: { name, phone: input.phone!.trim() },
    select: { id: true },
  });

  const lead = await prisma.lead.create({
    data: {
      customerId: customer.id,
      branchId: input.branchId ?? null,
      productId: input.productId ?? null,
      note: input.note?.trim().slice(0, 2000) || null,
    },
    select: { id: true },
  });

  return ok({ id: lead.id, created: !existing }, { status: 201 });
}
