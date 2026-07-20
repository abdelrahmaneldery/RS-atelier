import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { ACTIVE_BOOKING_STATUSES } from "./constants";
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
 * create re-checks under a transaction and may still fail with a clash.
 */

export type Occupancy = { start: Date; end: Date; bookingId: string };

/** Occupied intervals for a dress, from every booking that still holds it. */
export async function getOccupancy(productId: string): Promise<Occupancy[]> {
  const bookings = await prisma.booking.findMany({
    where: { productId, status: { in: ACTIVE_BOOKING_STATUSES } },
    select: { id: true, handoverDate: true, takebackDate: true },
  });

  return bookings.map((b) => {
    const interval = occupiedInterval(b);
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
export async function getFreeDatesForProduct(params: {
  productId: string;
  from?: Date;
  to?: Date;
}): Promise<{ dates: string[]; from: string; to: string }> {
  const today = startOfDay(new Date());
  // Never offer a past date, and never beyond the horizon.
  const from = params.from && params.from > today ? startOfDay(params.from) : today;
  const horizon = horizonDate(today);
  const to = params.to && params.to < horizon ? startOfDay(params.to) : horizon;

  const occupancy = await getOccupancy(params.productId);
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
export async function getFreeProductsForDate(params: {
  branchId: string;
  eventDate: Date;
  collectionId?: string;
}): Promise<string[]> {
  const window = deriveWindow(params.eventDate);
  if (checkWindowGuards(window)) return [];

  const candidates = await prisma.product.findMany({
    where: {
      ...visibleProductWhere(),
      branchId: params.branchId,
      ...(params.collectionId ? { collectionId: params.collectionId } : {}),
    },
    select: {
      id: true,
      bookings: {
        where: { status: { in: ACTIVE_BOOKING_STATUSES } },
        select: { id: true, handoverDate: true, takebackDate: true },
      },
    },
  });

  return candidates
    .filter((product) => {
      const occupancy = product.bookings.map((b) => ({
        ...occupiedInterval(b),
        bookingId: b.id,
      }));
      return !detectClash(window, occupancy).clashes;
    })
    .map((p) => p.id);
}

/**
 * Public catalogue visibility (§8). Every condition must hold:
 *   published · not Retired · at least one image · branch active AND published ·
 *   collection published (or no collection).
 *
 * Returned as a Prisma `where` fragment so it can never be forgotten at a
 * call site — every public read composes this.
 */
export function visibleProductWhere() {
  return {
    published: true,
    status: { not: "Retired" },
    images: { some: {} },
    branch: { active: true, published: true },
    OR: [{ collectionId: null }, { collection: { published: true } }],
  } satisfies Prisma.ProductWhereInput;
}

export function visibleBranchWhere() {
  return { active: true, published: true } satisfies Prisma.BranchWhereInput;
}

export function visibleCollectionWhere() {
  return {
    published: true,
    branch: { active: true, published: true },
  } satisfies Prisma.CollectionWhereInput;
}
