"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sticky call to action on mobile.
 *
 * Suppressed wherever a primary action is already on screen — the booking
 * flow, the booking lookup, and the branch picker itself.
 */
export function MobileCta() {
  const pathname = usePathname();

  const hidden =
    // The homepage hero already carries this exact call to action, and the
    // sticky bar sat directly beneath it showing the same label twice.
    pathname === "/" ||
    pathname === "/branches" ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/booking");

  if (hidden) return null;

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/97 px-4 py-3 backdrop-blur-sm sm:hidden">
      <Link
        href="/branches"
        className="flex min-h-12 w-full items-center justify-center border border-ink bg-ink px-6 py-3 font-sans text-xs font-medium uppercase tracking-[0.14em] text-ivory"
      >
        Find Your Gown
      </Link>
    </div>
  );
}
