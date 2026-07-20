/**
 * Business constants (§12).
 *
 * The server is authoritative. The client mirrors these purely so the UI can
 * pre-check and explain — never to decide. Every value is re-validated
 * server-side before anything is written.
 */

/** Deposit taken online at Confirm. */
export const DEPOSIT_PCT = 0.5;

/** Cleaning turnaround appended to every occupied window. */
export const BUFFER_WORKING_DAYS = 2;

/** Furthest event date a customer may select. */
export const HORIZON_DAYS = 15;

/** Maximum takeback − handover span. */
export const WINDOW_MAX_DAYS = 7;

/**
 * Days that do not count toward the cleaning buffer.
 *
 * 0 = Sunday … 6 = Saturday. Defaults to the Egyptian Friday–Saturday weekend.
 * TODO: confirm the atelier's actual non-working days — this is an assumption,
 * and it shifts every availability calculation.
 */
export const WEEKEND_DAYS: readonly number[] = [5, 6];

/** Default refund policy on cancellation after confirm (§7). */
export const REFUND_POLICY = "deposit_forfeit" as const;

export const CURRENCY = "EGP";

// --- Booking status (commercial track, §3) ---------------------------------

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "handed_over",
  "completed",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Held — awaiting deposit",
  confirmed: "Confirmed",
  handed_over: "Collected",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** What the customer should understand at each stage. */
export const BOOKING_STATUS_DESCRIPTIONS: Record<BookingStatus, string> = {
  pending:
    "Your dress is being held. It is not yet confirmed — complete the deposit and ID to secure it.",
  confirmed:
    "Your booking is confirmed. Collect your dress from the branch on your pickup date. The balance and insurance are paid in branch.",
  handed_over:
    "Your dress is with you. Please return it to the branch on your return date.",
  completed: "This rental is complete. Thank you.",
  cancelled: "This booking was cancelled.",
};

/**
 * Bookings that still occupy a dress. Cancelled and completed release it.
 */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "handed_over",
];

/** The website may only ever drive a booking to these (§2 cut line). */
export const WEBSITE_WRITABLE_STATUSES: BookingStatus[] = [
  "pending",
  "confirmed",
  "cancelled",
];

/** Cancellation is possible only before the dress leaves the branch (§7). */
export const CANCELLABLE_STATUSES: BookingStatus[] = ["pending", "confirmed"];

// --- Product status (physical track, §3) -----------------------------------

export const PRODUCT_STATUSES = [
  "Available",
  "Reserved",
  "HandedToClient",
  "Cleaning",
  "Retired",
] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Never shown on the website, whatever its published flag says (§8). */
export const HIDDEN_PRODUCT_STATUSES: ProductStatus[] = ["Retired"];

// --- Health band (§9) -------------------------------------------------------

export const HEALTH_BANDS = ["excellent", "good", "fair"] as const;
export type HealthBand = (typeof HEALTH_BANDS)[number];

export const HEALTH_BAND_LABELS: Record<HealthBand, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
};

export const HEALTH_BAND_DESCRIPTIONS: Record<HealthBand, string> = {
  excellent: "This piece has had minimal repair work.",
  good: "This piece has had some repair work over its life.",
  fair: "This piece is well worn and has been repaired several times.",
};

/**
 * Derived from lifetime repairs. `fix_count` itself is internal and is never
 * exposed publicly — only the band.
 */
export function healthBandFromFixCount(fixCount: number): HealthBand {
  if (fixCount <= 2) return "excellent";
  if (fixCount <= 5) return "good";
  return "fair";
}

// --- Money ------------------------------------------------------------------

/** Deposit for a given rental price, in the same minor units. */
export function depositFor(priceMinor: number): number {
  return Math.round(priceMinor * DEPOSIT_PCT);
}

export function balanceFor(priceMinor: number): number {
  return priceMinor - depositFor(priceMinor);
}
