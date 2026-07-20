import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { SITE } from "@/config/site";

/**
 * Brand mark. The supplied RS monogram, swapped to a white version while the
 * header floats over the dark hero.
 */
export function Logo({
  onDark,
  className,
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center", className)}
      aria-label={`${SITE.name} — home`}
    >
      <Image
        src={
          onDark
            ? "/media/brand/rs-logo-v2-light.png"
            : "/media/brand/rs-logo-v2-dark.png"
        }
        alt={SITE.name}
        width={528}
        height={506}
        priority
        className="h-11 w-auto sm:h-12"
        // Over the hero the mark can land on a bright patch of the photograph,
        // so a soft shadow keeps it legible on any background.
        style={onDark ? { filter: "drop-shadow(0 1px 8px rgb(22 19 15 / 0.55))" } : undefined}
      />
    </Link>
  );
}
