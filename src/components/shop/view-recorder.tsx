"use client";

import { useEffect } from "react";

import { recordRecentlyViewed } from "@/components/shop/shop-store";

/**
 * Records a dress as recently viewed, once per mount.
 *
 * Renders nothing. `recordRecentlyViewed` is an external-store write (not a
 * React setState), so calling it in a bare effect does not trip
 * `react-hooks/set-state-in-effect`.
 */
export function ViewRecorder({ slug }: { slug: string }) {
  useEffect(() => {
    recordRecentlyViewed(slug);
  }, [slug]);

  return null;
}
