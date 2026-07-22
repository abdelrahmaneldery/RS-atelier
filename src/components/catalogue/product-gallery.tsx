"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

import { cn } from "@/lib/cn";
import { IMAGE_SIZES } from "@/config/media";
import { overlayFade } from "@/lib/motion";
import { AtelierImage } from "@/components/ui/atelier-image";
import { DragScroll } from "@/components/ui/drag-scroll";

export type GalleryImage = { id: string; imageUrl: string; altText: string };

/**
 * A tall editorial ratio for the detail hero, so the image dominates its column
 * and closes the gap under it. object-cover keeps full-length gowns framed
 * without distortion.
 */
const DETAIL_ASPECT = "2 / 3";
const HOVER_ZOOM = 1.9;

/**
 * Gallery for a single gown with a premium zoom experience:
 *  - desktop: smooth cursor-follow magnify on the main image;
 *  - click / tap: opens a fullscreen lightbox with gallery navigation and
 *    tap-to-zoom.
 * Falls back to a tonal placeholder when no photograph has been uploaded.
 */
export function ProductGallery({
  images,
  productName,
  colour,
  isDemo = false,
}: {
  images: GalleryImage[];
  productName: string;
  colour: string | null;
  /** Adds a subtle "representative photography" caption over the image. */
  isDemo?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  const clamped = Math.min(activeIndex, usable.length - 1);
  const active = usable[clamped];

  return (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0 lg:flex-1 lg:flex-row-reverse lg:gap-6">
      <div className="relative flex-1 lg:min-h-0">
        <ZoomableImage
          src={active.imageUrl}
          alt={active.altText}
          onOpen={() => setLightboxOpen(true)}
        />
        {isDemo ? (
          <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/65 via-ink/20 to-transparent px-4 pb-3 pt-10 font-sans text-[0.625rem] leading-relaxed text-white/85">
            Photography shown is representative — photographs of this individual
            gown are being prepared.
          </p>
        ) : null}
      </div>

      {usable.length > 1 ? (
        <DragScroll
          className="flex gap-3 overflow-x-auto lg:w-24 lg:flex-col lg:self-start lg:overflow-visible"
          aria-label={`${productName} images`}
        >
          {usable.map((image, index) => {
            const isActive = index === clamped;
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

      <AnimatePresence>
        {lightboxOpen ? (
          <Lightbox
            key="lightbox"
            images={usable}
            index={clamped}
            onIndex={setActiveIndex}
            onClose={() => setLightboxOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// --- Main image with cursor-follow magnify ----------------------------------

function ZoomableImage({
  src,
  alt,
  onOpen,
}: {
  src: string;
  alt: string;
  onOpen: () => void;
}) {
  const frameRef = useRef<HTMLButtonElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);

  function moveOrigin(e: React.MouseEvent) {
    const frame = frameRef.current;
    const zoom = zoomRef.current;
    if (!frame || !zoom) return;
    const r = frame.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    // Updated imperatively so the pan stays buttery — no re-render per move.
    zoom.style.transformOrigin = `${x}% ${y}%`;
  }

  function enter() {
    // Hover magnify only where a real pointer can hover (desktop).
    if (zoomRef.current && window.matchMedia("(hover: hover)").matches) {
      zoomRef.current.style.transform = `scale(${HOVER_ZOOM})`;
    }
  }

  function leave() {
    if (!zoomRef.current) return;
    zoomRef.current.style.transform = "scale(1)";
    zoomRef.current.style.transformOrigin = "center";
  }

  return (
    <button
      ref={frameRef}
      type="button"
      onClick={onOpen}
      onMouseMove={moveOrigin}
      onMouseEnter={enter}
      onMouseLeave={leave}
      aria-label="Open full-size image"
      className="image-frame group relative block w-full cursor-zoom-in overflow-hidden lg:h-full"
      style={{ aspectRatio: DETAIL_ASPECT }}
    >
      <div
        ref={zoomRef}
        className="absolute inset-0 transition-transform duration-300 ease-out will-change-transform"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={IMAGE_SIZES.productDetail}
          priority
          className="object-cover"
        />
      </div>
      <span className="pointer-events-none absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-ivory/85 text-ink opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
        <ZoomIn aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
      </span>
    </button>
  );
}

// --- Fullscreen lightbox -----------------------------------------------------

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: GalleryImage[];
  index: number;
  onIndex: (next: number) => void;
  onClose: () => void;
}) {
  const count = images.length;
  const current = images[index];
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("center");
  const panelRef = useRef<HTMLDivElement>(null);

  function go(delta: number) {
    setZoomed(false);
    setOrigin("center");
    onIndex((index + delta + count) % count);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && count > 1) go(-1);
      else if (e.key === "ArrowRight" && count > 1) go(1);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, count]);

  function toggleZoom(e: React.MouseEvent) {
    e.stopPropagation();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${x}% ${y}%`);
    setZoomed((z) => !z);
  }

  // Rendered through a portal on <body> so it is a true top-level modal —
  // never clipped by, or stacked beneath, anything in the product layout.
  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      variants={overlayFade}
      initial="hidden"
      animate="show"
      exit="exit"
      onClick={onClose}
      className="fixed inset-0 z-[95] flex items-center justify-center overflow-hidden bg-ink/95 p-4 focus:outline-none"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center text-ivory/80 transition-colors hover:text-ivory"
      >
        <X aria-hidden="true" className="h-6 w-6" strokeWidth={1.5} />
      </button>

      <div className="relative h-[82vh] w-[92vw] max-w-5xl">
        <Image
          src={current.imageUrl}
          alt={current.altText}
          fill
          sizes="92vw"
          priority
          onClick={toggleZoom}
          className={cn(
            "object-contain transition-transform duration-300 ease-out will-change-transform",
            zoomed ? "cursor-zoom-out" : "cursor-zoom-in",
          )}
          style={{ transform: zoomed ? "scale(2.2)" : "scale(1)", transformOrigin: origin }}
        />
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/30 text-ivory/85 backdrop-blur-sm transition-colors hover:border-ivory hover:text-ivory sm:left-5"
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Next image"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/30 text-ivory/85 backdrop-blur-sm transition-colors hover:border-ivory hover:text-ivory sm:right-5"
          >
            <ChevronRight aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ivory/70">
            {index + 1} / {count}
          </div>
        </>
      ) : null}
    </motion.div>,
    document.body,
  );
}
