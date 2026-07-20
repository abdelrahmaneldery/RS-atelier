import { Container } from "@/components/ui/primitives";
import { ProductGridSkeleton } from "@/components/catalogue/product-card";

/** Shown while a branch wardrobe is being fetched. */
export default function BranchLoading() {
  return (
    <Container className="py-10 lg:py-14" aria-busy="true">
      <span className="sr-only">Loading the wardrobe…</span>
      <div aria-hidden="true">
        <div className="h-3 w-24 animate-pulse bg-sand" />
        <div className="mt-5 h-12 w-2/3 max-w-md animate-pulse bg-sand" />
        <div className="mt-4 h-4 w-1/2 max-w-sm animate-pulse bg-sand" />
        <div className="mt-12 h-24 w-full animate-pulse bg-sand" />
        <div className="mt-12">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </Container>
  );
}
