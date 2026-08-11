import "server-only";

import {
  getDb,
  type BranchRecord,
  type CollectionRecord,
  type Database,
  type ProductRecord,
} from "@/lib/db";
import { ACTIVE_BOOKING_STATUSES, type BookingStatus } from "./constants";
import {
  addDays,
  checkWindowGuards,
  deriveWindow,
  horizonDate,
  intervalsOverlap,
  occupiedInterval,
  startOfDay,
  toDateKey,
  type RentalWindow,
} from "./dates";

/**
 * Clash detection and availability (§5).
 *
 * A dress is one-of-one, so "available" means: no active booking's occupied
 * interval overlaps the proposed one. The occupied interval already includes
 * the cleaning buffer, so this is a single overlap test.
 *
 * Availability shown to a customer is ADVISORY. Between rendering a calendar
 * and pressing Book, the floor or another customer can take the dress, so
 * create re-checks at write time and may still fail with a clash.
 */

export type Occupancy = { start: Date; end: Date; bookingId: string };

/** Occupied intervals for a dress, from every booking that still holds it. */
export function getOccupancy(productId: string, db: Database = getDb()): Occupancy[] {
  return db.bookings
    .filter(
      (b) =>
        b.productId === productId &&
        ACTIVE_BOOKING_STATUSES.includes(b.status as BookingStatus),
    )
    .map((b) => {
      const interval = occupiedInterval({
        handoverDate: new Date(b.handoverDate),
        takebackDate: new Date(b.takebackDate),
      });
      return { ...interval, bookingId: b.id };
    });
}

export type ClashResult =
  | { clashes: false }
  | { clashes: true; message: string };

/** Does the proposed window collide with anything already holding this dress? */
export function detectClash(
  proposed: RentalWindow,
  occupancy: Occupancy[],
): ClashResult {
  const wanted = occupiedInterval(proposed);
  const hit = occupancy.find((o) => intervalsOverlap(wanted, o));
  if (!hit) return { clashes: false };
  return {
    clashes: true,
    message: "This dress is already booked for dates that overlap yours.",
  };
}

/**
 * Mode 1 — dress → free dates (§5).
 * Event dates within the range for which the default ±1 window would not clash.
 */
export function getFreeDatesForProduct(params: {
  productId: string;
  from?: Date;
  to?: Date;
}): { dates: string[]; from: string; to: string } {
  const today = startOfDay(new Date());
  // Never offer a past date, and never beyond the horizon.
  const from = params.from && params.from > today ? startOfDay(params.from) : today;
  const horizon = horizonDate(today);
  const to = params.to && params.to < horizon ? startOfDay(params.to) : horizon;

  const occupancy = getOccupancy(params.productId);
  const dates: string[] = [];

  for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
    const window = deriveWindow(cursor);
    if (checkWindowGuards(window)) continue;
    if (detectClash(window, occupancy).clashes) continue;
    dates.push(toDateKey(cursor));
  }

  return { dates, from: toDateKey(from), to: toDateKey(to) };
}

/**
 * Mode 2 — date → free dresses (§5).
 * Published dresses in a branch whose default window is free for that event.
 */
export function getFreeProductsForDate(params: {
  branchId: string;
  eventDate: Date;
  collectionId?: string;
}): string[] {
  const window = deriveWindow(params.eventDate);
  if (checkWindowGuards(window)) return [];

  const db = getDb();
  const candidates = db.products.filter(
    (p) =>
      isProductVisible(p, db) &&
      p.branchId === params.branchId &&
      (!params.collectionId || p.collectionId === params.collectionId),
  );

  return candidates
    .filter((product) => {
      const occupancy = getOccupancy(product.id, db);
      return !detectClash(window, occupancy).clashes;
    })
    .map((p) => p.id);
}

/**
 * Public catalogue visibility (§8). Every condition must hold:
 *   published · not Retired · at least one image · branch active AND published ·
 *   collection published (or no collection).
 *
 * Kept as predicate functions so it can never be forgotten at a call site —
 * every public read composes one of these.
 */
export function isProductVisible(
  product: ProductRecord,
  db: Database = getDb(),
): boolean {
  if (!product.published || product.status === "Retired") return false;
  if (!db.productImages.some((i) => i.productId === product.id)) return false;
  const branch = db.branches.find((b) => b.id === product.branchId);
  if (!branch || !isBranchVisible(branch)) return false;
  if (product.collectionId !== null) {
    const collection = db.collections.find((c) => c.id === product.collectionId);
    if (!collection || !collection.published) return false;
  }
  return true;
}

export function isBranchVisible(branch: BranchRecord): boolean {
  return branch.active && branch.published;
}

export function isCollectionVisible(
  collection: CollectionRecord,
  db: Database = getDb(),
): boolean {
  if (!collection.published) return false;
  const branch = db.branches.find((b) => b.id === collection.branchId);
  return Boolean(branch && isBranchVisible(branch));
}
