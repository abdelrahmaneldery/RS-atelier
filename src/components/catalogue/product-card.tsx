"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eye, X } from "lucide-react";

import { modalPanel, overlayFade } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { IMAGE_SIZES } from "@/config/media";
import { formatMoney } from "@/lib/format";
import { HEALTH_BAND_LABELS } from "@/lib/domain/constants";
import type { ApiProductCard } from "@/lib/api/contract";
import { AtelierImage } from "@/components/ui/atelier-image";
import { ButtonLink } from "@/components/ui/button";
import { DragScroll } from "@/components/ui/drag-scroll";

/**
 * The single dress card used across the whole site — catalogue, shop, home
 * grids and recently viewed.
 *
 * The image dominates: one tall luxury portrait, and beneath it only the
 * gown's name and rental price. Quick view and availability stay as subtle
 * hover actions / tags on the image, so every grid reads as a clean, premium
 * editorial without competing metadata.
 */

/** One tall portrait ratio for every product image across the site. */
const CARD_ASPECT = "2 / 3";

export type CardAvailability = { label: string; free: boolean | null };

function dressName(p: ApiProductCard): string {
  if (p.silhouette && p.colour) return `${p.colour} ${p.silhouette}`;
  if (p.silhouette) return p.silhouette;
  if (p.colour) return `${p.colour} Gown`;
  return p.collection?.name ?? "Occasion Gown";
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function conditionAvailability(p: ApiProductCard): CardAvailability {
  return { label: `Condition: ${HEALTH_BAND_LABELS[p.healthBand]}`, free: null };
}

// --- Card -------------------------------------------------------------------

export function ProductCard({
  product,
  priority,
  availability,
  onQuickView,
  className,
}: {
  product: ApiProductCard;
  priority?: boolean;
  /** Availability annotation. Only surfaced when a date is being checked. */
  availability?: CardAvailability;
  /** When provided, renders the Quick View control on the image. */
  onQuickView?: () => void;
  className?: string;
}) {
  const href = `/dresses/${product.slug}`;
  const avail = availability ?? conditionAvailability(product);

  return (
    <article
      className={cn(
        "group flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-1",
        className,
      )}
    >
      <div className="relative">
        <Link href={href} className="block focus-visible:outline-offset-4">
          <AtelierImage
            src={product.primaryImage?.url || null}
            alt={product.primaryImage?.altText ?? `${dressName(product)} occasion gown`}
            colour={product.colour}
            aspect={CARD_ASPECT}
            sizes={IMAGE_SIZES.productCard}
            priority={priority}
          />
        </Link>

        {/* Availability only when a date is being checked — otherwise nothing. */}
        {avail.free !== null ? (
          <span
            className={cn(
              "absolute left-2.5 top-2.5 inline-flex items-center px-2 py-1 font-sans text-[0.5625rem] font-medium uppercase tracking-[0.14em] backdrop-blur-sm",
              avail.free ? "bg-ivory/90 text-ink" : "bg-ink/70 text-ivory",
            )}
          >
            {avail.free ? "Available" : "Unavailable"}
          </span>
        ) : null}

        {onQuickView ? (
          <button
            type="button"
            onClick={onQuickView}
            className="absolute inset-x-2 bottom-2 inline-flex min-h-10 items-center justify-center gap-2 border border-white/70 bg-ink/70 font-sans text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ivory backdrop-blur-sm transition-opacity duration-200 hover:bg-ink lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
          >
            <Eye aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.5} />
            Quick View
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col pt-5 text-center">
        <h3 className="font-display text-xl leading-snug text-ink lg:text-2xl">
          <Link href={href} className="link-underline">
            {dressName(product)}
          </Link>
        </h3>

        <p className="mt-2.5 flex flex-col font-sans">
          <span className="text-base font-semibold text-ink lg:text-lg">
            {product.price === null
              ? "Price on request"
              : formatMoney(product.price, product.currency)}
          </span>
          {product.price !== null ? (
            <span className="mt-0.5 text-xs font-normal uppercase tracking-[0.1em] text-mist">
              per rental
            </span>
          ) : null}
        </p>
      </div>
    </article>
  );
}

// --- Grid (owns the shared Quick View modal) --------------------------------

export function ProductGrid({
  products,
  priorityCount = 0,
  className,
  availabilityFor,
  layout = "grid",
}: {
  products: ApiProductCard[];
  priorityCount?: number;
  className?: string;
  /** Per-product availability annotation (e.g. free on the chosen date). */
  availabilityFor?: (product: ApiProductCard) => CardAvailability;
  /** "grid" (default) wraps into rows; "rail" is a horizontal scroll strip. */
  layout?: "grid" | "rail";
}) {
  const [quickView, setQuickView] = useState<ApiProductCard | null>(null);

  const renderCard = (product: ApiProductCard, index: number) => (
    <ProductCard
      product={product}
      priority={index < priorityCount}
      availability={availabilityFor?.(product)}
      onQuickView={() => setQuickView(product)}
    />
  );

  return (
    <>
      {layout === "rail" ? (
        <DragScroll className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:gap-6 lg:gap-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product, index) => (
            <li
              key={product.id}
              className="w-[62vw] shrink-0 snap-start sm:w-[40vw] lg:w-[23vw] xl:w-[20vw]"
            >
              {renderCard(product, index)}
            </li>
          ))}
        </DragScroll>
      ) : (
        <div
          className={cn(
            "grid grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4",
            className,
          )}
        >
          {products.map((product, index) => (
            <div key={product.id}>{renderCard(product, index)}</div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {quickView ? (
          <QuickView
            key="quick-view"
            product={quickView}
            availability={availabilityFor?.(quickView) ?? conditionAvailability(quickView)}
            onClose={() => setQuickView(null)}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-5 gap-y-12 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <div
            className="w-full animate-pulse bg-sand"
            style={{ aspectRatio: CARD_ASPECT }}
          />
          <div className="mt-5 h-5 w-3/5 animate-pulse bg-sand" />
          <div className="mt-3 h-4 w-2/5 animate-pulse bg-sand" />
        </div>
      ))}
    </div>
  );
}

// --- Quick view modal -------------------------------------------------------

function QuickView({
  product,
  availability,
  onClose,
}: {
  product: ApiProductCard;
  availability: CardAvailability;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const href = `/dresses/${product.slug}`;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      variants={overlayFade}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 sm:items-center"
    >
      <button
        type="button"
        aria-label="Close quick view"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <motion.div
        ref={panelRef}
        variants={modalPanel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${dressName(product)} quick view`}
        className="relative z-10 flex max-h-[90svh] w-full max-w-3xl flex-col overflow-y-auto bg-offwhite shadow-raised focus:outline-none sm:max-h-[86vh]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center bg-ivory/85 text-ink backdrop-blur-sm hover:text-gold-deep"
        >
          <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <div className="grid sm:grid-cols-2">
          <AtelierImage
            src={product.primaryImage?.url || null}
            alt={product.primaryImage?.altText ?? `${dressName(product)} occasion gown`}
            colour={product.colour}
            aspect={CARD_ASPECT}
            sizes="(min-width: 640px) 24rem, 100vw"
            zoomOnHover={false}
          />

          <div className="flex flex-col p-6 sm:p-8">
            <h2 className="font-display text-2xl leading-tight text-ink">
              {dressName(product)}
            </h2>
            <p className="mt-1 text-xs text-mist">
              {[product.colour ? titleCase(product.colour) : null, product.collection?.name]
                .filter(Boolean)
                .join(" · ") || "One-of-one gown"}
            </p>

            <p className="mt-4 font-sans text-xl font-semibold text-ink">
              {product.price === null ? (
                "Price on request"
              ) : (
                <>
                  {formatMoney(product.price, product.currency)}{" "}
                  <span className="text-sm font-normal text-stone">per rental</span>
                </>
              )}
            </p>

            <p className="mt-2 text-xs text-graphite">
              {product.fabric ? `${titleCase(product.fabric)} · ` : ""}
              Condition: {HEALTH_BAND_LABELS[product.healthBand]}
            </p>

            <p
              className={cn(
                "mt-3 text-xs font-medium uppercase tracking-[0.12em]",
                availability.free === true ? "text-success" : "text-mist",
              )}
            >
              {availability.label}
            </p>

            {product.description ? (
              <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-stone">
                {product.description}
              </p>
            ) : null}

            <div className="mt-6">
              <ButtonLink href={href} className="w-full">
                View Full Details
              </ButtonLink>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
