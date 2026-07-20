import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { env } from "./env";

/**
 * This repository is the customer-facing website only. There are no accounts
 * and no credentials of any kind here: browsing and booking are anonymous, and
 * a booking is retrieved with its reference plus the phone number it was made
 * with. Staff authentication belongs to the separate dashboard repository.
 */

/** Constant-time comparison that tolerates length mismatch. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// --- Opaque references ----------------------------------------------------

/** Unambiguous alphabet: no 0/O/1/I, so references survive being read aloud. */
const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Public booking references. Random rather than sequential, so they are not
 * enumerable and reveal nothing about booking volume. A reference alone is not
 * sufficient to view a booking — the matching phone number is also required.
 */
export function generateReference(prefix: string, length = 6): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += REFERENCE_ALPHABET[randomInt(0, REFERENCE_ALPHABET.length)];
  }
  return `${prefix}-${out}`;
}

/** Normalises user-typed references: "rs 7f3k2q" -> "RS-7F3K2Q". */
export function normalizeReference(input: string, prefix: string): string {
  const cleaned = (input ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const body = cleaned.startsWith(prefix) ? cleaned.slice(prefix.length) : cleaned;
  return `${prefix}-${body}`;
}

// --- Abuse throttling -----------------------------------------------------

/**
 * Coarse, non-reversible client fingerprint used only for rate-limit bucketing
 * on the public booking endpoints. Never stored alongside identifying data.
 */
export function hashClientKey(value: string): string {
  return createHmac("sha256", env().SESSION_SECRET)
    .update(value)
    .digest("hex")
    .slice(0, 32);
}
