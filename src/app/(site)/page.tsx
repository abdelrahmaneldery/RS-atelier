import { api } from "@/lib/api/client";
import { getStore } from "@/lib/store";
import { Container } from "@/components/ui/primitives";
import { ProductGrid } from "@/components/catalogue/product-card";
import {
  OccasionCategories,
  SectionHead,
  StorefrontHero,
} from "@/components/home/storefront-sections";
import { RecentlyViewed } from "@/components/shop/recently-viewed";

/**
 * The homepage is the RS Atelier storefront — a full-bleed campaign hero,
 * occasion categories, trending gowns and recently-viewed pieces, all drawn
 * from the single store.
 */

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const store = await getStore();
  const shopHref = "/shop";

  const trending = store ? await api.trending(store.slug, 8).catch(() => []) : [];

  return (
    <>
      <StorefrontHero shopHref={shopHref} />

      <OccasionCategories shopHref={shopHref} />

      {/* Trending — the most requested gowns. */}
      {trending.length > 0 ? (
        <section className="border-t border-line py-10 lg:py-14">
          <Container>
            <SectionHead title="Trending Now" href="/shop" linkLabel="View All" />
            <div className="mt-8">
              <ProductGrid products={trending} layout="rail" />
            </div>
          </Container>
        </section>
      ) : null}

      {/* Recently viewed — client, localStorage; renders nothing when empty. */}
      <RecentlyViewed
        title="Recently Viewed"
        className="border-t border-line py-10 lg:py-14"
      />
    </>
  );
}
