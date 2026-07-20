import Image from "next/image";

import { cn } from "@/lib/cn";
import { tintForColour } from "@/config/media";

/**
 * The single image component for the whole platform.
 *
 * When no photograph has been uploaded, this renders a tonal panel tinted from
 * the garment's colour rather than substituting unrelated stock photography.
 * That keeps the catalogue honest: the site never shows a picture of a dress
 * the atelier does not hold. Drop real files into public/media/ and set the
 * image URL in /admin — every surface picks them up with no code change.
 */
export function AtelierImage({
  src,
  alt,
  aspect = "3 / 4",
  sizes,
  colour,
  priority,
  className,
  zoomOnHover = true,
}: {
  src?: string | null;
  alt: string;
  aspect?: string;
  sizes?: string;
  /** Used to tint the placeholder when no photograph exists. */
  colour?: string | null;
  priority?: boolean;
  className?: string;
  zoomOnHover?: boolean;
}) {
  if (src) {
    return (
      <div
        className={cn("image-frame relative w-full", className)}
        style={{ aspectRatio: aspect }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", zoomOnHover && "image-zoom")}
        />
      </div>
    );
  }

  return <ImagePlaceholder alt={alt} aspect={aspect} colour={colour} className={className} />;
}

/**
 * Honest placeholder. Carries the alt text for assistive technology and is
 * visually marked so nobody mistakes it for product photography.
 */
export function ImagePlaceholder({
  alt,
  aspect = "3 / 4",
  colour,
  className,
}: {
  alt: string;
  aspect?: string;
  colour?: string | null;
  className?: string;
}) {
  const tint = tintForColour(colour);

  return (
    <div
      className={cn(
        "image-frame relative flex w-full items-center justify-center overflow-hidden",
        className,
      )}
      style={{ aspectRatio: aspect }}
      role="img"
      aria-label={`${alt} — photograph not yet available`}
    >
      {/* Tonal ground derived from the garment colour. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `linear-gradient(160deg, ${tint} 0%, ${tint}cc 45%, #f0e9de 100%)`,
        }}
      />
      {/* Fine gold hairline frame keeps the panel feeling composed. */}
      <div
        aria-hidden="true"
        className="absolute inset-3 border border-white/25"
      />
      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <span className="font-display text-3xl font-light text-white/85 drop-shadow-sm">
          RS
        </span>
        <span className="font-sans text-[0.5625rem] font-medium uppercase tracking-[0.2em] text-white/70">
          Photography to follow
        </span>
      </div>
    </div>
  );
}
