import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApiError, api } from "@/lib/api/client";
import { Container, ErrorState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { ShopClient } from "@/components/shop/shop-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const branch = await api.branch(slug);
    return {
      title: branch.name,
      description: `Browse the gowns held at ${branch.name} and check which dates are free.`,
      alternates: { canonical: `/branches/${slug}` },
    };
  } catch {
    return { title: "Branch not found" };
  }
}

/**
 * The branch wardrobe. Renders the same catalogue UI as /shop — one shared
 * `ShopClient` (toolbar, filter drawer, category chips, product grid) — scoped
 * to the branch in the URL rather than the cookie, so every listing page across
 * the site looks and behaves identically.
 */
export default async function BranchPage({ params }: PageProps) {
  const { slug } = await params;

  let branch;
  try {
    branch = await api.branch(slug);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  let products;
  let collections;
  try {
    [products, collections] = await Promise.all([
      api.products(slug),
      api.collections(slug),
    ]);
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return (
      <Container className="py-20">
        <ErrorState
          body="We could not load the wardrobe just now. Please try again shortly."
          action={
            <ButtonLink href={`/branches/${slug}`} variant="secondary">
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
