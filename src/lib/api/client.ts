import "server-only";

import { headers } from "next/headers";
import { z } from "zod";

import {
  apiErrorSchema,
  availabilitySchema,
  bookingSchema,
  branchSchema,
  collectionSchema,
  itemSchema,
  leadResponseSchema,
  listSchema,
  productAvailabilitySchema,
  productCardSchema,
  productDetailSchema,
} from "./contract";

/**
 * Client for the Atelier RS backend (§10).
 *
 * The site never touches a database directly — it speaks HTTP to this API.
 * While the real backend is being built, requests resolve to the local mock
 * under src/app/api/v1/**, which implements the same contract.
 *
 * To switch to the real backend: set API_BASE_URL (and API_SITE_KEY) and delete
 * the mock. No page or component changes.
 */

async function baseUrl(): Promise<string> {
  const configured = process.env.API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  // No backend configured yet, so fall back to the same-origin mock. Server
  // components need an absolute URL, and the origin is derived from the actual
  // request rather than an env var so the site works on any host or port.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto =
      h.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");
    return `${proto}://${host}/api/v1`;
  }

  // Outside a request (e.g. a build-time call), fall back to the site URL.
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return `${site.replace(/\/$/, "")}/api/v1`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** The dress was taken between browsing and booking (§11). */
  get isClash() {
    return this.status === 409;
  }

  get isNotFound() {
    return this.status === 404;
  }

  /** Validation failed — the message is safe to show the customer. */
  get isValidation() {
    return this.status === 422;
  }
}

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  /** Seconds. Omit for no caching — correct for anything availability-related. */
  revalidate?: number;
  signal?: AbortSignal;
};

async function request<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  options: RequestOptions = {},
): Promise<z.infer<T>> {
  const url = `${await baseUrl()}${path}`;
  const siteKey = process.env.API_SITE_KEY?.trim();

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        // Site key / origin allowlist — never a staff token (§10).
        ...(siteKey ? { "X-Site-Key": siteKey } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      signal: options.signal,
      cache: options.revalidate === undefined ? "no-store" : undefined,
      ...(options.revalidate !== undefined
        ? { next: { revalidate: options.revalidate } }
        : {}),
    });
  } catch {
    throw new ApiError(
      503,
      "NETWORK",
      "We could not reach the atelier system. Please try again shortly.",
    );
  }

  const text = await response.text();
  const json: unknown = text ? safeParseJson(text) : null;

  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(json);
    throw new ApiError(
      response.status,
      parsed.success ? parsed.data.error.code : "UNKNOWN",
      parsed.success
        ? parsed.data.error.message
        : "Something went wrong. Please try again.",
    );
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    // A contract mismatch is a bug, not a customer-facing condition.
    console.error(`[api] response did not match contract for ${path}`, parsed.error.issues);
    throw new ApiError(
      502,
      "CONTRACT_MISMATCH",
      "Something went wrong. Please try again.",
    );
  }

  return parsed.data;
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function query(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// --- Public reads -----------------------------------------------------------

export const api = {
  /** Step 1 of every journey — the branch picker. */
  async branches() {
    const { data } = await request(
      "/public/branches",
      listSchema(branchSchema),
      { revalidate: 300 },
    );
    return data;
  },

  async branch(slug: string) {
    const { data } = await request(
      `/public/branches/${encodeURIComponent(slug)}`,
      itemSchema(branchSchema),
      { revalidate: 300 },
    );
    return data;
  },

  async collections(branchSlug: string) {
    const { data } = await request(
      `/public/branches/${encodeURIComponent(branchSlug)}/collections`,
      listSchema(collectionSchema),
      { revalidate: 300 },
    );
    return data;
  },

  async products(
    branchSlug: string,
    params: { collection?: string; colour?: string; silhouette?: string; sort?: string } = {},
  ) {
    const { data } = await request(
      `/public/branches/${encodeURIComponent(branchSlug)}/products${query({
        collection_id: params.collection,
        colour: params.colour,
        silhouette: params.silhouette,
        sort: params.sort,
      })}`,
      listSchema(productCardSchema),
      { revalidate: 60 },
    );
    return data;
  },

  /** Newest gowns at a branch. */
  async newArrivals(branchSlug: string, take = 8) {
    const data = await this.products(branchSlug, { sort: "newest" });
    return data.slice(0, take);
  },

  /** Most-requested gowns at a branch. */
  async trending(branchSlug: string, take = 8) {
    const data = await this.products(branchSlug, { sort: "trending" });
    return data.slice(0, take);
  },

  async product(slug: string) {
    const { data } = await request(
      `/public/products/${encodeURIComponent(slug)}`,
      itemSchema(productDetailSchema),
      { revalidate: 60 },
    );
    return data;
  },

  /** Dress → free dates. Never cached: availability changes constantly. */
  async productAvailability(slug: string, params: { from?: string; to?: string } = {}) {
    const { data } = await request(
      `/public/products/${encodeURIComponent(slug)}/availability${query({
        from: params.from,
        to: params.to,
      })}`,
      itemSchema(productAvailabilitySchema),
    );
    return data;
  },

  /** Date → free dresses. Never cached. */
  async availability(params: { branchId: string; eventDate: string; collectionId?: string }) {
    const { data } = await request(
      `/public/availability${query({
        branch_id: params.branchId,
        event_date: params.eventDate,
        collection_id: params.collectionId,
      })}`,
      itemSchema(availabilitySchema),
    );
    return data;
  },

  // --- Writes ---------------------------------------------------------------

  /** Flow A — lead capture. Creates no booking and holds no dress. */
  async createLead(input: {
    name: string;
    phone: string;
    note?: string;
    branchId?: string;
    productId?: string;
  }) {
    const { data } = await request(
      "/public/leads",
      itemSchema(leadResponseSchema),
      { method: "POST", body: input },
    );
    return data;
  },

  /** Flow B step 1 — create the hold. Booking → pending, dress → Reserved. */
  async createBooking(input: {
    productId: string;
    branchId: string;
    eventDate: string;
    name: string;
    phone: string;
  }) {
    const { data } = await request("/bookings", itemSchema(bookingSchema), {
      method: "POST",
      body: input,
    });
    return data;
  },

  /** Flow B step 2 — deposit + ID. Booking → confirmed. */
  async confirmBooking(input: {
    reference: string;
    phone: string;
    depositAmount: number;
    depositMethod: string;
    idFileRef: string;
    idFileName?: string;
  }) {
    const { data } = await request(
      `/bookings/${encodeURIComponent(input.reference)}/confirm`,
      itemSchema(bookingSchema),
      { method: "POST", body: input },
    );
    return data;
  },

  async cancelBooking(input: { reference: string; phone: string }) {
    const { data } = await request(
      `/bookings/${encodeURIComponent(input.reference)}/cancel`,
      itemSchema(bookingSchema),
      { method: "POST", body: input },
    );
    return data;
  },

  /** Reference + phone. Neither alone is sufficient. */
  async booking(reference: string, phone: string) {
    const { data } = await request(
      `/bookings/${encodeURIComponent(reference)}${query({ phone })}`,
      itemSchema(bookingSchema),
    );
    return data;
  },
};
