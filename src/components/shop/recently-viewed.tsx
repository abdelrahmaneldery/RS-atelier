"use client";

import { ProductCard } from "@/components/catalogue/product-card";
import { Container } from "@/components/ui/primitives";
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
        <h2 className="mb-8 font-display text-[1.75rem] leading-none text-ink lg:text-[2.25rem]">
          {title}
        </h2>

        {/* Horizontal scroll rail at every breakpoint. */}
        <ul className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:gap-6 lg:gap-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {shown.map((product) => (
            <li
              key={product.id}
              className="w-[62vw] shrink-0 snap-start sm:w-[40vw] lg:w-[23vw] xl:w-[20vw]"
            >
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
