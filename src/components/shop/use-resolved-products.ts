"use client";

import { useEffect, useState } from "react";

import { resolveProducts } from "@/app/(site)/saved/actions";
import type { ApiProductCard } from "@/lib/api/contract";

/**
 * Resolves store slugs into product cards via the `resolveProducts` server
 * action whenever the slug list changes.
 *
 * `null` means "not resolved yet" (first paint / in flight); an array — possibly
 * empty — means the resolve completed. setState only ever happens inside a
 * promise callback, never synchronously in the effect body, so this satisfies
 * `react-hooks/set-state-in-effect`.
 *
 * `slugs` MUST be a referentially-stable array (e.g. the memoised value from
 * `useRecentlyViewed`) so the effect does not refire every render.
 */
export function useResolvedProducts(slugs: string[]): ApiProductCard[] | null {
  const [products, setProducts] = useState<ApiProductCard[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (slugs.length === 0) {
      // Resolve to empty without a server round-trip. Deferred to a microtask
      // so the state update is not synchronous inside the effect body.
      Promise.resolve().then(() => {
        if (!cancelled) setProducts([]);
      });
      return () => {
        cancelled = true;
      };
    }

    resolveProducts(slugs).then((resolved) => {
      if (!cancelled) setProducts(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [slugs]);

  return products;
}
