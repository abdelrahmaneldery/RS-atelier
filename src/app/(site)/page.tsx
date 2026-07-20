import Link from "next/link";

import { api } from "@/lib/api/client";
import { ASPECT, IMAGE_SIZES, branchImage } from "@/config/media";
import { getSelectedBranch } from "@/lib/branch-selection";

import { AtelierImage } from "@/components/ui/atelier-image";
import { Container, Eyebrow, SectionHeading } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { ProductGrid } from "@/components/catalogue/product-card";
import {
  OccasionCategories,
  SectionHead,
  ServiceStrip,
  StorefrontHero,
} from "@/components/home/storefront-sections";
import { NewArrivalsFeature } from "@/components/home/new-arrivals-feature";
import { RecentlyViewed } from "@/components/shop/recently-viewed";

/**
 * The homepage is a branch-scoped ecommerce storefront.
 *
 * Once a branch is selected it shows that branch's catalogue immediately —
 * a full-bleed campaign hero, categories, product grids and inline
 * availability — with nothing mixed in from other branches. Until a branch is
 * chosen, the branch gate (rendered by the layout) covers a minimal prompt.
 */

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const selectedBranch = await getSelectedBranch();

  // No branch yet — the gate overlays this. Keep the underlay minimal.
  if (!selectedBranch) {
    const branches = await api.branches().catch(() => []);
    return <BranchLanding branches={branches} />;
  }

  const slug = selectedBranch.slug;
  const shopHref = `/branches/${slug}`;

  const [trending, collections] = await Promise.all([
    api.trending(slug, 8).catch(() => []),
    api.collections(slug).catch(() => []),
  ]);

  return (
    <>
      <StorefrontHero shopHref={shopHref} />

      <OccasionCategories shopHref={shopHref} />

      {/* New Arrivals campaign + date finder + featured collections. */}
      <NewArrivalsFeature
        branchId={selectedBranch.id}
        branchSlug={slug}
        shopHref={shopHref}
        collections={collections}
      />

      {/* Trending — most requested at this branch. */}
      {trending.length > 0 ? (
        <section className="border-t border-line py-10 lg:py-14">
          <Container>
            <SectionHead
              eyebrow="Most Requested"
              title="Trending Now"
              href={`${shopHref}?sort=trending`}
              linkLabel="View All"
            />
            <div className="mt-8">
              <ProductGrid products={trending} />
            </div>
          </Container>
        </section>
      ) : null}

      {/* Recently viewed — client, localStorage; renders nothing when empty. */}
      <RecentlyViewed
        title="Recently Viewed"
        className="border-t border-line py-10 lg:py-14"
      />

      <ServiceStrip />
    </>
  );
}

/** Minimal underlay shown behind the branch gate before a branch is chosen. */
function BranchLanding({
  branches,
}: {
  branches: Awaited<ReturnType<typeof api.branches>>;
}) {
  return (
    <Container className="py-16 lg:py-24">
      <Reveal>
        <Eyebrow gold>Rawan Samir Atelier</Eyebrow>
        <SectionHeading
          headingLevel="h1"
          title="Choose Your Branch"
          lede="Every gown is held at one branch and collected there. Choose where you would like to explore."
          className="mt-5"
        />
      </Reveal>

      {branches.length > 0 ? (
        <Reveal delay={80}>
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch, index) => (
              <li key={branch.id} className="flex flex-col">
                <Link href={`/branches/${branch.slug}`} className="group block">
                  <AtelierImage
                    src={branchImage(index)}
                    alt={`${branch.name} atelier interior`}
                    aspect={ASPECT.branch}
                    sizes={IMAGE_SIZES.card}
                    colour="beige"
                  />
                </Link>
                <h2 className="mt-4 font-display text-xl text-ink">
                  <Link href={`/branches/${branch.slug}`} className="link-underline">
                    {branch.name}
                  </Link>
                </h2>
              </li>
            ))}
          </ul>
        </Reveal>
      ) : null}
    </Container>
  );
}
