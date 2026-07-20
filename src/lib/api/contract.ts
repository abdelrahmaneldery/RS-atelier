import { z } from "zod";

/**
 * The Atelier RS public API contract (§10).
 *
 * These schemas are the boundary between this website and the backend. They are
 * used to validate every response, so a backend change surfaces as a clear
 * parse error rather than an undefined field deep inside a component.
 *
 * They are also what the local mock (src/app/api/v1/**) implements, which keeps
 * the mock honest — it cannot drift from what the site expects.
 */

export const healthBandSchema = z.enum(["excellent", "good", "fair"]);

export const branchSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  country: z.string().nullable(),
  location: z.string().nullable(),
});
export type ApiBranch = z.infer<typeof branchSchema>;

export const collectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  coverImage: z.string().nullable(),
  productCount: z.number().int().nonnegative(),
});
export type ApiCollection = z.infer<typeof collectionSchema>;

export const productImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  altText: z.string(),
  isPrimary: z.boolean(),
  /**
   * True for stand-in photography that is not of the actual garment.
   *
   * Optional on purpose: a backend that does not model this must not break the
   * site. Absent means "this is a real photograph", which is the safe default
   * once the atelier's own images are in place.
   */
  isDemo: z.boolean().optional().default(false),
});

/**
 * Card-level product. Note what is absent: `fix_count`, ops fields, and any
 * other customer's data (§8).
 */
export const productCardSchema = z.object({
  id: z.string(),
  code: z.string(),
  slug: z.string(),
  description: z.string(),
  fabric: z.string().nullable(),
  colour: z.string().nullable(),
  silhouette: z.string().nullable(),
  healthBand: healthBandSchema,
  /** Minor units (piastres). Null when no public price is set. */
  price: z.number().int().nullable(),
  currency: z.string(),
  primaryImage: productImageSchema.nullable(),
  branch: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
  collection: z
    .object({ id: z.string(), name: z.string(), slug: z.string() })
    .nullable(),
});
export type ApiProductCard = z.infer<typeof productCardSchema>;

export const productDetailSchema = productCardSchema.extend({
  images: z.array(productImageSchema),
  insuranceAmount: z.number().int().nullable(),
  deposit: z.number().int().nullable(),
  balance: z.number().int().nullable(),
});
export type ApiProductDetail = z.infer<typeof productDetailSchema>;

/** Dress → free dates. */
export const productAvailabilitySchema = z.object({
  productId: z.string(),
  from: z.string(),
  to: z.string(),
  /** Event dates ("YYYY-MM-DD") whose default window would not clash. */
  dates: z.array(z.string()),
});
export type ApiProductAvailability = z.infer<typeof productAvailabilitySchema>;

/** Date → free dresses. */
export const availabilitySchema = z.object({
  branchId: z.string(),
  eventDate: z.string(),
  handoverDate: z.string(),
  takebackDate: z.string(),
  products: z.array(productCardSchema),
});
export type ApiAvailability = z.infer<typeof availabilitySchema>;

export const leadResponseSchema = z.object({
  id: z.string(),
  created: z.boolean(),
});

export const bookingSchema = z.object({
  id: z.string(),
  reference: z.string(),
  status: z.enum([
    "pending",
    "confirmed",
    "handed_over",
    "completed",
    "cancelled",
  ]),
  eventDate: z.string(),
  handoverDate: z.string(),
  takebackDate: z.string(),
  price: z.number().int(),
  deposit: z.number().int(),
  balance: z.number().int(),
  insuranceAmount: z.number().int(),
  currency: z.string(),
  depositPaid: z.boolean(),
  idSubmitted: z.boolean(),
  customerName: z.string(),
  product: productCardSchema,
  createdAt: z.string(),
});
export type ApiBooking = z.infer<typeof bookingSchema>;

/** Every non-2xx response uses this shape. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export const listSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: z.array(item) });

export const itemSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ data: item });
