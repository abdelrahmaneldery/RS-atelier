import type { Metadata } from "next";

import { ApiError, api } from "@/lib/api/client";
import { getStore } from "@/lib/store";
import { Container, ErrorState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { ShopClient } from "@/components/shop/shop-client";

export const metadata: Metadata = {
  title: "Shop the Collection",
  description:
    "Browse the one-of-one gowns at the RS Atelier store and check availability for your date.",
  alternates: { canonical: "/shop" },
};

/**
 * The Shop — a full-width, branch-scoped catalogue.
 *
 * Everything shown is a published, non-retired gown held at the selected
 * branch (the API already filters retired/unpublished stock). Filtering,
 * search and quick view all happen client-side over this branch's list;
 * availability and booking remain server-backed and unchanged.
 */
export default async function ShopPage() {
  const store = await getStore();

  if (!store) {
    return (
      <Container className="py-20">
        <ErrorState
          body="We could not load the wardrobe just now. Please try again shortly."
          action={
            <ButtonLink href="/shop" variant="secondary">
              Try Again
            </ButtonLink>
          }
        />
      </Container>
    );
  }

  let products;
  try {
    products = await api.products(store.slug);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return (
      <Container className="py-20">
        <ErrorState
          body="We could not load the wardrobe just now. Please try again shortly."
          action={
            <ButtonLink href="/shop" variant="secondary">
              Try Again
            </ButtonLink>
          }
        />
      </Container>
    );
  }

  return (
    <ShopClient
      branch={{
        id: store.id,
        name: store.name,
        slug: store.slug,
        location: store.location,
        country: store.country,
      }}
      products={products}
    />
  );
}

/** Live availability is read per request, so this page is never prerendered. */
export const dynamic = "force-dynamic";
