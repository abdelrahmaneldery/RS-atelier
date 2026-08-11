import "server-only";

import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * JSON-file data store for the mock public API.
 *
 * The website is a client of the Atelier RS backend (`/api/v1/public`). Until
 * that backend is live, the route handlers under src/app/api/v1/** implement
 * the documented contract on top of this store so the site can run end to end.
 *
 * Catalogue data (branches, collections, products, images, settings) is
 * authored in src/data/db.json. Runtime writes (bookings, customers, leads)
 * are applied in memory and persisted back to the same file, best-effort —
 * good enough for a single-process mock, and gone entirely once the real
 * backend lands.
 *
 * All DateTime fields are ISO-8601 strings. Money is in piastres.
 */

export type BranchRecord = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  location: string | null;
  active: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CollectionRecord = {
  id: string;
  branchId: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductRecord = {
  id: string;
  branchId: string;
  collectionId: string | null;
  code: string;
  slug: string;
  description: string;
  fabric: string | null;
  colour: string | null;
  silhouette: string | null;
  /** Available | Reserved | HandedToClient | Cleaning | Retired */
  status: string;
  fixCount: number;
  price: number | null;
  requestCount: number;
  insuranceAmount: number | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductImageRecord = {
  id: string;
  productId: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
  isDemo: boolean;
};

export type SettingRecord = {
  key: string;
  value: string;
  isPlaceholder: boolean;
  updatedAt: string;
};

export type CustomerRecord = {
  id: string;
  name: string;
  phone: string;
  /** E.164 without '+'. Dedupe key. */
  normalizedPhone: string;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadRecord = {
  id: string;
  customerId: string;
  branchId: string | null;
  productId: string | null;
  note: string | null;
  createdAt: string;
};

export type BookingRecord = {
  id: string;
  reference: string;
  customerId: string;
  productId: string;
  branchId: string;
  eventDate: string;
  handoverDate: string;
  takebackDate: string;
  price: number;
  deposit: number;
  balance: number;
  insuranceAmount: number;
  /** pending | confirmed | handed_over | completed | cancelled */
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type BookingStatusLogRecord = {
  id: string;
  bookingId: string;
  fromStatus: string | null;
  toStatus: string;
  /** Null when the customer acted from the website. */
  memberId: string | null;
  note: string | null;
  createdAt: string;
};

export type PaymentRecord = {
  id: string;
  bookingId: string;
  /** deposit | balance | insurance | refund */
  type: string;
  /** in | out */
  direction: string;
  amount: number;
  method: string;
  memberId: string | null;
  createdAt: string;
};

export type IdHoldRecord = {
  id: string;
  bookingId: string;
  fileRef: string;
  fileName: string | null;
  releasedAt: string | null;
  createdAt: string;
};

export type Database = {
  branches: BranchRecord[];
  collections: CollectionRecord[];
  products: ProductRecord[];
  productImages: ProductImageRecord[];
  settings: SettingRecord[];
  customers: CustomerRecord[];
  leads: LeadRecord[];
  bookings: BookingRecord[];
  bookingStatusLogs: BookingStatusLogRecord[];
  payments: PaymentRecord[];
  idHolds: IdHoldRecord[];
};

const DB_FILE = path.join(process.cwd(), "src", "data", "db.json");

// One in-memory copy, shared across hot reloads in development.
const globalForDb = globalThis as unknown as { __jsonDb: Database | undefined };

export function getDb(): Database {
  if (!globalForDb.__jsonDb) {
    globalForDb.__jsonDb = JSON.parse(
      fs.readFileSync(DB_FILE, "utf8"),
    ) as Database;
  }
  return globalForDb.__jsonDb;
}

/**
 * Persists the in-memory state back to src/data/db.json. Written atomically
 * (temp file + rename) so a crash mid-write cannot corrupt the store.
 */
export function persistDb(): void {
  const db = getDb();
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2) + "\n");
  fs.renameSync(tmp, DB_FILE);
}

export function uid(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
