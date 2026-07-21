"use server";

import { api } from "@/lib/api/client";

/**
 * Re-read the dress's available event dates at the moment the customer presses
 * "Check Availability". READ-ONLY: this only reads availability for the gown at
 * its branch — it never holds the dress, creates a booking, or records anything.
 * Returns null on error, so the caller can fall back to the dates loaded with
 * the page.
 */
export async function recheckProductDates(slug: string): Promise<string[] | null> {
  try {
    const data = await api.productAvailability(slug);
    return data.dates;
  } catch {
    return null;
  }
}
