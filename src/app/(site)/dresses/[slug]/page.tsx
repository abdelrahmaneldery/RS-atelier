import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApiError, api } from "@/lib/api/client";
import { formatMoney } from "@/lib/format";
import {
  HEALTH_BAND_DESCRIPTIONS,
  HORIZON_DAYS,
} from "@/lib/domain/constants";
import { JsonLd, productJsonLd } from "@/lib/seo";
import { getSelectedBranch } from "@/lib/branch-selection";
import { CrossBranchNotice } from "@/components/branch/cross-branch-notice";
import { Container } from "@/components/ui/primitives";
import { ProductGallery } from "@/components/catalogue/product-gallery";
import { AvailabilityCalendar } from "@/components/catalogue/availability-calendar";
import { LeadForm } from "@/components/booking/lead-form";
import { LeadSection } from "@/components/booking/lead-section";
import { ViewRecorder } from "@/components/shop/view-recorder";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await api.product(slug);
    const title = `${product.colour ?? ""} ${product.silhouette ?? "Gown"}`.trim();
    return {
      title: title,
      description: product.description.slice(0, 160),
      alternates: { canonical: `/dresses/${slug}` },
    };
  } catch {
    return { title: "Dress not found" };
  }
}

/**
 * Dress detail (§8 fields).
 *
 * Shows what the catalogue publishes: code, description, fabric, colour,
 * silhouette, health band, images, price. Never `fix_count`, ops fields, or
 * anything belonging to another customer.
 */
export default async function DressPage({ params }: PageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await api.product(slug);
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  const [availability, selectedBranch] = await Promise.all([
    api.productAvailability(slug),
    getSelectedBranch(),
  ]);

  // Never silently mix branches: a gown from elsewhere is shown, but flagged.
  const isCrossBranch =
    selectedBranch !== null && selectedBranch.slug !== product.branch.slug;

  const title = `${product.colour ?? ""} ${product.silhouette ?? "Gown"}`.trim();

  const specs: Array<{ label: string; value: string | null }> = [
    { label: "Fabric", value: product.fabric },
    { label: "Colour", value: product.colour },
    { label: "Silhouette", value: product.silhouette },
    { label: "Collection", value: product.collection?.name ?? null },
    { label: "Branch", value: product.branch.name },
  ];

  return (
    <>
      <ViewRecorder slug={product.slug} />

      <JsonLd
        data={productJsonLd({
          name: `${title} — ${product.code}`,
          slug: product.slug,
          code: product.code,
          description: product.description,
          price: product.price,
          currency: product.currency,
          imageUrl: product.primaryImage?.url || null,
        })}
      />

      <Container className="py-8 lg:py-12">
        {isCrossBranch && selectedBranch ? (
          <CrossBranchNotice
            productBranchName={product.branch.name}
            productBranchSlug={product.branch.slug}
            selectedBranchName={selectedBranch.name}
            selectedBranchSlug={selectedBranch.slug}
          />
        ) : null}

        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 text-xs text-stone">
            <li>
              <Link href="/branches" className="hover:text-ink">
                Branches
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/branches/${product.branch.slug}`}
                className="hover:text-ink"
              >
                {product.branch.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-charcoal" aria-current="page">
              {title}
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[3fr_2fr] lg:gap-16">
          <div>
            <ProductGallery
              images={product.images.map((i) => ({
                id: i.id,
                imageUrl: i.url,
                altText: i.altText,
              }))}
              productName={title}
              colour={product.colour}
            />

            {/* Stand-in photography is labelled, never passed off as the piece. */}
            {product.images.some((i) => i.isDemo) ? (
              <p className="mt-3 text-xs leading-relaxed text-mist">
                Photography shown is representative. Photographs of this
                individual gown are being prepared.
              </p>
            ) : null}
          </div>

          <div>
            <h1 className="text-[2.25rem] leading-tight sm:text-[2.75rem]">
              {title}
            </h1>

            <p className="mt-5 font-display text-2xl text-ink">
              {product.price === null ? (
                "Price on request"
              ) : (
                <>
                  {formatMoney(product.price, product.currency)}{" "}
                  <span className="text-base text-stone">per rental</span>
                </>
              )}
            </p>

            <p className="mt-6 max-w-[52ch] leading-relaxed text-graphite">
              {product.description}
            </p>

            <p className="mt-4 text-xs leading-relaxed text-mist">
              {HEALTH_BAND_DESCRIPTIONS[product.healthBand]}
            </p>

            <dl className="mt-10 border-t border-line">
              {specs
                .filter((s) => s.value)
                .map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col gap-1 border-b border-line py-3 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <dt className="eyebrow shrink-0 sm:w-40">{s.label}</dt>
                    <dd className="text-sm text-charcoal">{s.value}</dd>
                  </div>
                ))}
            </dl>

            {/* Dress → free dates. */}
            <section className="mt-12 border-t border-line pt-8">
              <h2 className="font-display text-2xl text-ink">
                Check Your Date
              </h2>
              <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-stone">
                This gown is one of a kind, so it can only be worn by one person
                at a time. Choose your event date within the next {HORIZON_DAYS}{" "}
                days to check availability.
              </p>

              <AvailabilityCalendar
                productSlug={product.slug}
                freeDates={availability.dates}
                similarHref={`/branches/${product.branch.slug}`}
              />
            </section>
          </div>
        </div>
      </Container>

      {/* Enquiry — the only way to progress; reserving is done with the branch. */}
      <LeadSection
        id="request-a-call"
        title="Prefer to speak to someone?"
        description={`Leave your details and the ${product.branch.name} team will call you. This does not hold the gown.`}
      >
        <LeadForm
          branchId={product.branch.id}
          productId={product.id}
          defaultNote={`Interested in the ${title}.`}
        />
      </LeadSection>
    </>
  );
}

/**
 * Rendered per request: this page reads live availability, and the API is
 * reached over HTTP (the local mock is same-origin, so there is nothing to
 * prerender against at build time).
 */
export const dynamic = "force-dynamic";
