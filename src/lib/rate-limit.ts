import "server-only";

import { headers } from "next/headers";

import { hashClientKey } from "./crypto";

/**
 * Throttling for the public, unauthenticated endpoints.
 *
 * Booking submission and booking lookup are open to anyone, so they need abuse
 * protection that does not depend on a session. Counters are keyed by a
 * non-reversible fingerprint and kept in process memory — matching the JSON
 * store, this mock backend runs as a single process, so that is where the
 * limit holds.
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

// Attempt timestamps per bucket+key, shared across hot reloads in development.
const globalForRateLimit = globalThis as unknown as {
  __rateLimitBuckets: Map<string, number[]> | undefined;
};

function store(): Map<string, number[]> {
  return (globalForRateLimit.__rateLimitBuckets ??= new Map());
}

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
export function checkRateLimit(
  name: RateLimitName,
  keyHash: string,
): RateLimitResult {
  const { bucket, max, windowMs } = RATE_LIMITS[name];
  const key = `${bucket}:${keyHash}`;
  const now = Date.now();
  const since = now - windowMs;

  const recent = (store().get(key) ?? []).filter((t) => t >= since);

  if (recent.length >= max) {
    store().set(key, recent);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((recent[0] + windowMs - now) / 1000),
    );
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  store().set(key, recent);

  return { allowed: true, remaining: max - recent.length };
}

export function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return minutes <= 1
    ? "Too many attempts. Please try again in a moment."
    : `Too many attempts. Please try again in about ${minutes} minutes.`;
}
