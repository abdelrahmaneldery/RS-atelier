import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ApiError, api } from "@/lib/api/client";
import { SORT_OPTIONS } from "@/config/site";
import { ASPECT, IMAGE_SIZES } from "@/config/media";
import { HORIZON_DAYS } from "@/lib/domain/constants";
import { AtelierImage } from "@/components/ui/atelier-image";
import {
  Container,
  EmptyState,
  Eyebrow,
  SectionHeading,
} from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { ProductGrid, ProductGridSkeleton } from "@/components/catalogue/product-card";
import { DateFinder } from "@/components/catalogue/date-finder";
import { CatalogueToolbar } from "@/components/catalogue/catalogue-toolbar";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

/** The branch wardrobe: collections, filters, and the date finder (§6). */
export default async function BranchPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  let branch;
  try {
    branch = await api.branch(slug);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  const collections = await api.collections(slug);

  const collectionSlug = first(query.collection);
  const activeCollection = collections.find((c) => c.slug === collectionSlug);
  const sort = first(query.sort);

  return (
    <>
      <Container className="py-8 lg:py-10">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-stone">
            <li>
              <Link href="/branches" className="hover:text-ink">
                Branches
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-charcoal" aria-current="page">
              {branch.name}
            </li>
          </ol>
        </nav>

        <Eyebrow gold>The Wardrobe</Eyebrow>
        <SectionHeading
          headingLevel="h1"
          title={branch.name}
          lede={
            branch.location
              ? `${branch.location}${branch.country ? `, ${branch.country}` : ""}`
              : "Every gown below is held at this branch and collected here."
          }
          className="mt-5"
        />
      </Container>

      {/* Date → free dresses (§5 mode 2). */}
      <section className="border-y border-line bg-ivory-deep py-8">
        <Container>
          <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
            <div>
              <h2 className="font-display text-2xl text-ink">
                Know your date? Start there.
              </h2>
              <p className="mt-1.5 max-w-[58ch] text-sm leading-relaxed text-stone">
                Tell us when your event is and we will show only the gowns free
                that night. Bookings open up to {HORIZON_DAYS} days ahead.
              </p>
            </div>
            <DateFinder branchId={branch.id} branchSlug={branch.slug} />
          </div>
        </Container>
      </section>

      {collections.length > 0 ? (
        <section className="border-b border-line py-7">
          <Container>
            <h2 className="eyebrow">Collections</h2>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              <li>
                <CollectionChip
                  href={`/branches/${slug}`}
                  active={!activeCollection}
                  label="All Gowns"
                />
              </li>
              {collections.map((collection) => (
                <li key={collection.id}>
                  <CollectionChip
                    href={`/branches/${slug}?collection=${collection.slug}`}
                    active={activeCollection?.id === collection.id}
                    label={`${collection.name} (${collection.productCount})`}
                  />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      <Container className="py-10 lg:py-12">
        {activeCollection ? (
          <div className="mb-10">
            <h2 className="font-display text-3xl text-ink">
              {activeCollection.name}
            </h2>
            {activeCollection.description ? (
              <p className="mt-3 max-w-[62ch] leading-relaxed text-stone">
                {activeCollection.description}
              </p>
            ) : null}
            {activeCollection.coverImage ? (
              <div className="mt-6 max-w-3xl">
                <AtelierImage
                  src={activeCollection.coverImage}
                  alt={`${activeCollection.name} collection`}
                  aspect={ASPECT.banner}
                  sizes={IMAGE_SIZES.full}
                  zoomOnHover={false}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <CatalogueToolbar
          branchSlug={slug}
          sortOptions={[...SORT_OPTIONS]}
          currentSort={sort}
          currentCollection={collectionSlug}
        />

        <Suspense key={`${collectionSlug}-${sort}`} fallback={<ProductGridSkeleton />}>
          <BranchProducts
            branchSlug={slug}
            collectionId={activeCollection?.id}
            sort={sort}
          />
        </Suspense>
      </Container>
    </>
  );
}

async function BranchProducts({
  branchSlug,
  collectionId,
  sort,
}: {
  branchSlug: string;
  collectionId?: string;
  sort?: string;
}) {
  const products = await api.products(branchSlug, {
    collection: collectionId,
    sort,
  });

  if (products.length === 0) {
    return (
      <EmptyState
        title="No gowns to show here yet"
        body="This branch has not published any pieces in this collection. Try another collection, or browse the full wardrobe."
        action={
          <ButtonLink href={`/branches/${branchSlug}`} variant="secondary">
            View All Gowns
          </ButtonLink>
        }
      />
    );
  }

  return (
    <>
      <p className="mb-8 text-sm text-stone">
        {products.length} {products.length === 1 ? "gown" : "gowns"}
      </p>
      <ProductGrid products={products} priorityCount={4} />
    </>
  );
}

function CollectionChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "inline-flex min-h-11 items-center border border-ink bg-ink px-4 py-2 text-xs uppercase tracking-[0.12em] text-ivory"
          : "inline-flex min-h-11 items-center border border-line-strong px-4 py-2 text-xs uppercase tracking-[0.12em] text-charcoal transition-colors hover:border-ink hover:text-ink"
      }
    >
      {label}
    </Link>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Rendered per request: this page reads live availability, and the API is
 * reached over HTTP (the local mock is same-origin, so there is nothing to
 * prerender against at build time).
 */
export const dynamic = "force-dynamic";
