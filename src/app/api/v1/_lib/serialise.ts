import { NextResponse } from "next/server";

import type { BookingRecord, Database, ProductRecord } from "@/lib/db";

import { CURRENCY, balanceFor, depositFor, healthBandFromFixCount } from "@/lib/domain/constants";
import { toDateKey } from "@/lib/domain/dates";

/**
 * Shared serialisation for the mock backend.
 *
 * These functions are the only place where store records become public
 * payloads, which is how §8's "fields to hide" rule is enforced: `fixCount`,
 * ops fields and other customers' data have no path to the wire because they
 * are never copied here.
 */

export type ProductRow = {
  id: string;
  code: string;
  slug: string;
  description: string;
  fabric: string | null;
  colour: string | null;
  silhouette: string | null;
  fixCount: number;
  price: number | null;
  insuranceAmount: number | null;
  branch: { id: string; name: string; slug: string };
  collection: { id: string; name: string; slug: string } | null;
  images: Array<{
    id: string;
    url: string;
    altText: string;
    isPrimary: boolean;
    isDemo: boolean;
  }>;
};

/** Joins a product record with its branch, collection and ordered images. */
export function buildProductRow(
  product: ProductRecord,
  db: Database,
): ProductRow {
  const branch = db.branches.find((b) => b.id === product.branchId);
  if (!branch) {
    throw new Error(`Product ${product.id} references missing branch.`);
  }
  const collection =
    product.collectionId === null
      ? null
      : (db.collections.find((c) => c.id === product.collectionId) ?? null);
  const images = db.productImages
    .filter((i) => i.productId === product.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: product.id,
    code: product.code,
    slug: product.slug,
    description: product.description,
    fabric: product.fabric,
    colour: product.colour,
    silhouette: product.silhouette,
    fixCount: product.fixCount,
    price: product.price,
    insuranceAmount: product.insuranceAmount,
    branch: { id: branch.id, name: branch.name, slug: branch.slug },
    collection: collection
      ? { id: collection.id, name: collection.name, slug: collection.slug }
      : null,
    images: images.map((i) => ({
      id: i.id,
      url: i.url,
      altText: i.altText,
      isPrimary: i.isPrimary,
      isDemo: i.isDemo,
    })),
  };
}

export function serialiseProductCard(product: ProductRow) {
  const primary =
    product.images.find((i) => i.isPrimary) ?? product.images[0] ?? null;

  return {
    id: product.id,
    code: product.code,
    slug: product.slug,
    description: product.description,
    fabric: product.fabric,
    colour: product.colour,
    silhouette: product.silhouette,
    // Only the derived band is public — never fixCount itself (§9).
    healthBand: healthBandFromFixCount(product.fixCount),
    price: product.price,
    currency: CURRENCY,
    primaryImage: primary
      ? {
          id: primary.id,
          url: primary.url,
          altText: primary.altText,
          isPrimary: primary.isPrimary,
          isDemo: primary.isDemo,
        }
      : null,
    branch: product.branch,
    collection: product.collection,
  };
}

export function serialiseProductDetail(product: ProductRow) {
  return {
    ...serialiseProductCard(product),
    images: product.images.map((i) => ({
      id: i.id,
      url: i.url,
      altText: i.altText,
      isPrimary: i.isPrimary,
      isDemo: i.isDemo,
    })),
    insuranceAmount: product.insuranceAmount,
    deposit: product.price === null ? null : depositFor(product.price),
    balance: product.price === null ? null : balanceFor(product.price),
  };
}

export type BookingRow = {
  id: string;
  reference: string;
  status: string;
  eventDate: string;
  handoverDate: string;
  takebackDate: string;
  price: number;
  deposit: number;
  balance: number;
  insuranceAmount: number;
  createdAt: string;
  customer: { name: string };
  product: ProductRow;
  payments: Array<{ type: string; direction: string }>;
  idHold: { id: string; releasedAt: string | null } | null;
};

/** Joins a booking record with its customer, product row, payments and hold. */
export function buildBookingRow(
  booking: BookingRecord,
  db: Database,
): BookingRow {
  const customer = db.customers.find((c) => c.id === booking.customerId);
  const product = db.products.find((p) => p.id === booking.productId);
  if (!customer || !product) {
    throw new Error(`Booking ${booking.id} references missing records.`);
  }
  const idHold = db.idHolds.find((h) => h.bookingId === booking.id) ?? null;

  return {
    id: booking.id,
    reference: booking.reference,
    status: booking.status,
    eventDate: booking.eventDate,
    handoverDate: booking.handoverDate,
    takebackDate: booking.takebackDate,
    price: booking.price,
    deposit: booking.deposit,
    balance: booking.balance,
    insuranceAmount: booking.insuranceAmount,
    createdAt: booking.createdAt,
    customer: { name: customer.name },
    product: buildProductRow(product, db),
    payments: db.payments
      .filter((p) => p.bookingId === booking.id)
      .map((p) => ({ type: p.type, direction: p.direction })),
    idHold: idHold ? { id: idHold.id, releasedAt: idHold.releasedAt } : null,
  };
}

export function serialiseBooking(booking: BookingRow) {
  return {
    id: booking.id,
    reference: booking.reference,
    status: booking.status,
    eventDate: toDateKey(new Date(booking.eventDate)),
    handoverDate: toDateKey(new Date(booking.handoverDate)),
    takebackDate: toDateKey(new Date(booking.takebackDate)),
    price: booking.price,
    deposit: booking.deposit,
    balance: booking.balance,
    insuranceAmount: booking.insuranceAmount,
    currency: CURRENCY,
    depositPaid: booking.payments.some(
      (p) => p.type === "deposit" && p.direction === "in",
    ),
    idSubmitted: Boolean(booking.idHold && !booking.idHold.releasedAt),
    customerName: booking.customer.name,
    product: serialiseProductCard(booking.product),
    createdAt: new Date(booking.createdAt).toISOString(),
  };
}

// --- Response helpers -------------------------------------------------------

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function notFound(message = "Not found.") {
  return fail(404, "NOT_FOUND", message);
}
