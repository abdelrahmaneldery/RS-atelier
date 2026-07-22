"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import { IMAGE_SIZES } from "@/config/media";
import { AtelierImage } from "@/components/ui/atelier-image";
import { DragScroll } from "@/components/ui/drag-scroll";

export type GalleryImage = { id: string; imageUrl: string; altText: string };

/**
 * A tall editorial ratio for the detail hero, so the image dominates its column
 * and closes the gap under it. Taller than the 3:4 catalogue crop; object-cover
 * keeps full-length gowns framed without distortion.
 */
const DETAIL_ASPECT = "2 / 3";

/**
 * Gallery for a single gown. Falls back to a tonal placeholder when no
 * photograph has been uploaded, rather than substituting a stock image.
 */
export function ProductGallery({
  images,
  productName,
  colour,
}: {
  images: GalleryImage[];
  productName: string;
  colour: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Records with an empty URL exist only to satisfy the "at least one image"
  // visibility rule; they are not real photographs.
  const usable = images.filter((i) => i.imageUrl);

  if (usable.length === 0) {
    return (
      <AtelierImage
        src={null}
        alt={images[0]?.altText ?? `${productName} occasion gown`}
        colour={colour}
        aspect={DETAIL_ASPECT}
        sizes={IMAGE_SIZES.productDetail}
        priority
        zoomOnHover={false}
      />
    );
  }

  const active = usable[Math.min(activeIndex, usable.length - 1)];

  return (
    <div className="flex flex-col gap-4 lg:flex-row-reverse lg:gap-6">
      <div className="flex-1">
        <AtelierImage
          src={active.imageUrl}
          alt={active.altText}
          colour={colour}
          aspect={DETAIL_ASPECT}
          sizes={IMAGE_SIZES.productDetail}
          priority
          zoomOnHover={false}
        />
      </div>

      {usable.length > 1 ? (
        <DragScroll
          className="flex gap-3 overflow-x-auto lg:w-24 lg:flex-col lg:overflow-visible"
          aria-label={`${productName} images`}
        >
          {usable.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <li key={image.id} className="w-20 shrink-0 lg:w-full">
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`View image ${index + 1} of ${usable.length}`}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "block w-full border transition-colors",
                    isActive
                      ? "border-gold"
                      : "border-transparent hover:border-line-strong",
                  )}
                >
                  <AtelierImage
                    src={image.imageUrl}
                    alt=""
                    colour={colour}
                    aspect={DETAIL_ASPECT}
                    sizes="96px"
                    zoomOnHover={false}
                  />
                </button>
              </li>
            );
          })}
        </DragScroll>
      ) : null}
    </div>
  );
}
