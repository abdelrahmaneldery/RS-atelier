import { Container } from "@/components/ui/primitives";
import { ProductGridSkeleton } from "@/components/catalogue/product-card";

/** Shown while a branch wardrobe is being fetched. Mirrors the Shop layout. */
export default function BranchLoading() {
  return (
    <Container className="pt-8 lg:pt-10" aria-busy="true">
      <span className="sr-only">Loading the wardrobe…</span>
      <div aria-hidden="true">
        <div className="h-10 w-2/3 max-w-md animate-pulse bg-sand" />
        <div className="mt-4 h-4 w-40 animate-pulse bg-sand" />
        <div className="mt-8 flex gap-2 border-y border-line py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-24 animate-pulse bg-sand" />
          ))}
        </div>
        <div className="flex flex-col gap-3 py-6 sm:flex-row">
          <div className="h-11 flex-1 animate-pulse bg-sand" />
          <div className="h-11 w-52 animate-pulse bg-sand" />
          <div className="h-11 w-28 animate-pulse bg-sand" />
        </div>
        <div className="pb-16">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </Container>
  );
}
