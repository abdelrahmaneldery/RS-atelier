import "server-only";

import { headers } from "next/headers";

import { prisma } from "./prisma";
import { hashClientKey } from "./crypto";

/**
 * Throttling for the public, unauthenticated endpoints.
 *
 * Booking submission and booking lookup are open to anyone, so they need abuse
 * protection that does not depend on a session. Counters are keyed by a
 * non-reversible fingerprint and stored in the database, so the limit holds
 * across server instances.
 */

export const RATE_LIMITS = {
  /** Lead capture — cheap to spam, so held tighter than booking. */
  leadSubmit: { bucket: "lead_submit", max: 8, windowMs: 60 * 60 * 1000 },
  /** Booking creation. Each one holds a real dress, so this is deliberately low. */
  bookingCreate: { bucket: "booking_create", max: 5, windowMs: 60 * 60 * 1000 },
  /** Booking retrieval — the meaningful brute-force surface. */
  bookingLookup: { bucket: "booking_lookup", max: 15, windowMs: 15 * 60 * 1000 },
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

/**
 * Best-effort client identity. Behind a proxy this is the forwarded address;
 * it is only ever used for throttling, never for identification.
 */
export async function getClientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown";
  return hashClientKey(ip);
}

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Records an attempt and reports whether it is within the limit.
 * Call this *before* doing the work being protected.
 */
export async function checkRateLimit(
  name: RateLimitName,
  keyHash: string,
): Promise<RateLimitResult> {
  const { bucket, max, windowMs } = RATE_LIMITS[name];
  const since = new Date(Date.now() - windowMs);

  const recent = await prisma.rateLimitEntry.findMany({
    where: { bucket, keyHash, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  if (recent.length >= max) {
    const oldest = recent[0].createdAt.getTime();
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - Date.now()) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  await prisma.rateLimitEntry.create({ data: { bucket, keyHash } });

  // Opportunistic housekeeping so the table does not grow without bound.
  if (Math.random() < 0.02) {
    void prisma.rateLimitEntry
      .deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      })
      .catch(() => undefined);
  }

  return { allowed: true, remaining: max - recent.length - 1 };
}

export function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return minutes <= 1
    ? "Too many attempts. Please try again in a moment."
    : `Too many attempts. Please try again in about ${minutes} minutes.`;
}
