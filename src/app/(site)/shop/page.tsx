import type { Metadata } from "next";

import { ApiError, api } from "@/lib/api/client";
import { getSelectedBranch } from "@/lib/branch-selection";
import { Container, Eyebrow, ErrorState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { ShopClient } from "@/components/shop/shop-client";

export const metadata: Metadata = {
  title: "Shop the Collection",
  description:
    "Browse the one-of-one gowns held at your chosen RS Atelier branch and reserve for your date.",
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
  const branch = await getSelectedBranch();

  if (!branch) {
    return (
      <Container className="py-20 lg:py-28">
        <div className="mx-auto max-w-xl text-center">
          <Eyebrow gold>The Wardrobe</Eyebrow>
          <h1 className="mt-4 font-display text-[2rem] leading-tight text-ink sm:text-[2.6rem]">
            Choose a branch to shop
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-stone">
            Every gown is held at one branch and collected there. Pick where you
            would like to shop and we will show only what is available to you.
          </p>
          <ButtonLink href="/branches" size="lg" className="mt-8">
            Choose Your Branch
          </ButtonLink>
        </div>
      </Container>
    );
  }

  let products;
  let collections;
  try {
    [products, collections] = await Promise.all([
      api.products(branch.slug),
      api.collections(branch.slug),
    ]);
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
        id: branch.id,
        name: branch.name,
        slug: branch.slug,
        location: branch.location,
        country: branch.country,
      }}
      products={products}
      collections={collections}
    />
  );
}

/** Live availability is read per request, so this page is never prerendered. */
export const dynamic = "force-dynamic";
