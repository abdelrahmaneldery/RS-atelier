"use client";

import { cn } from "@/lib/cn";
import { ProductCard } from "@/components/catalogue/product-card";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { useRecentlyViewed } from "@/components/shop/shop-store";
import { useResolvedProducts } from "@/components/shop/use-resolved-products";

/** How many recently-viewed dresses to surface. */
const MAX_SHOWN = 8;

/**
 * Rail of recently-viewed dresses. Reads the client-only store, so it renders
 * nothing during SSR / first paint, and nothing once resolved if the visitor
 * has viewed no dresses (or none still resolve) — no empty heading, no shift.
 */
export function RecentlyViewed({
  title = "Recently Viewed",
  className,
}: {
  title?: string;
  className?: string;
}) {
  const { slugs } = useRecentlyViewed();
  const products = useResolvedProducts(slugs);

  if (!products || products.length === 0) return null;

  const shown = products.slice(0, MAX_SHOWN);

  return (
    <section aria-label={title} className={className}>
      <Container>
        <Eyebrow gold className="mb-5">
          {title}
        </Eyebrow>

        {/* Scroll-snap rail on mobile; a 3/4-up grid from `sm` upward. */}
        <ul
          className={cn(
            "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2",
            "[-ms-overflow-style:none] [scrollbar-width:none]",
            "sm:grid sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible",
            "lg:grid-cols-4 xl:gap-x-8",
          )}
        >
          {shown.map((product) => (
            <li
              key={product.id}
              className="w-[62vw] shrink-0 snap-start sm:w-auto sm:shrink"
            >
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
