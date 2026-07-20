"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { PRIMARY_NAV, UTILITY_NAV, type NavLink } from "@/config/site";
import type { ApiBranch } from "@/lib/api/contract";
import { BranchSwitcher } from "@/components/branch/branch-switcher";
import { Logo } from "./logo";

/**
 * Site header. No cart icon — this platform has no cart and no checkout of
 * many items. The one commitment offered anywhere is to reserve a single gown.
 *
 * On the homepage the header floats transparently over the full-bleed hero and
 * renders in white; once scrolled past the hero it transitions to a solid
 * off-white bar with dark type. Everywhere else it is solid from the start.
 */
export function Header({
  announcement,
  branches,
  selectedBranch,
}: {
  announcement: string;
  branches: ApiBranch[];
  selectedBranch: ApiBranch | null;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Route changes close the drawer. Adjusting during render rather than in an
  // effect avoids a frame where it is still open over the new page.
  const [panelPath, setPanelPath] = useState(pathname);
  if (panelPath !== pathname) {
    setPanelPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /**
   * The homepage hero is full-bleed and sits behind the header, so the bar
   * floats transparently over it in white until the customer scrolls, then
   * transitions to the solid off-white treatment. Never transparent while the
   * mobile drawer is open, which needs a legible bar behind it.
   */
  const overHero = isHome && !scrolled && !menuOpen;

  // /branches/<slug>/... pages belong to a specific branch. Switching away from
  // that branch means the current page no longer applies.
  const pageBranchSlug = pathname.startsWith("/branches/")
    ? pathname.split("/")[2]
    : undefined;

  // Once a branch is selected the nav becomes an ecommerce menu scoped to it;
  // until then it points at the branch picker and the brand pages.
  const nav: NavLink[] = selectedBranch
    ? [
        { label: "Shop", href: "/shop" },
        { label: "Contact Us", href: "/contact" },
        { label: "Rental Policy", href: "/rental-policy" },
      ]
    : PRIMARY_NAV;

  const utilities: NavLink[] = selectedBranch
    ? [{ label: "My Booking", href: "/booking" }]
    : UTILITY_NAV;

  return (
    <>
      <a
        href="#main"
        className="sr-only-focusable absolute left-4 top-4 z-[60] bg-ink px-4 py-2 text-xs uppercase tracking-[0.14em] text-ivory"
      >
        Skip to content
      </a>

      {announcement ? (
        <div className="bg-ink px-4 py-2.5 text-center">
          <p className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.18em] text-ivory/85">
            {announcement}
          </p>
        </div>
      ) : null}

      <header
        className={cn(
          "sticky top-0 z-50 h-[var(--header-h)] border-b",
          // Colour, background and shadow all animate together.
          "transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
          overHero
            ? "border-transparent bg-transparent"
            : "border-line bg-offwhite/95 shadow-subtle backdrop-blur-sm",
        )}
      >
        <div className="mx-auto grid h-full w-full max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-6 px-5 sm:px-8 lg:px-12">
          <div className="justify-self-start">
            <Logo onDark={overHero} />
          </div>

          <nav aria-label="Primary" className="hidden items-center gap-6 justify-self-center lg:flex">
            {nav.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "link-underline font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em]",
                    "transition-colors duration-300",
                    overHero
                      ? "text-white/85 hover:text-white"
                      : active
                        ? "text-ink"
                        : "text-graphite hover:text-ink",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-self-end gap-2 sm:gap-3">
            {selectedBranch ? (
              <BranchSwitcher
                branches={branches}
                selected={selectedBranch}
                onDark={overHero}
                pageBranchSlug={pageBranchSlug}
              />
            ) : null}

            {utilities.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                aria-label={link.label}
                title={link.label}
                className={cn(
                  "hidden h-11 w-11 items-center justify-center transition-colors duration-300 md:inline-flex",
                  overHero
                    ? "text-white/85 hover:text-white"
                    : "text-graphite hover:text-ink",
                )}
              >
                <ShoppingBag aria-hidden="true" className="h-6 w-6" strokeWidth={1.5} />
              </Link>
            ))}

            <Link
              href={selectedBranch ? "/shop" : "/branches"}
              className={cn(
                "hidden min-h-11 items-center border px-5 py-2.5 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] transition-colors duration-300 sm:inline-flex",
                overHero
                  ? "border-white/60 text-white hover:border-white hover:bg-white hover:text-ink"
                  : "border-ink bg-ink text-ivory hover:bg-charcoal",
              )}
            >
              {selectedBranch ? "Shop Now" : "Find Your Gown"}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className={cn(
                "flex h-11 w-11 items-center justify-center transition-colors duration-300 lg:hidden",
                overHero ? "text-white hover:text-white/80" : "text-graphite hover:text-ink",
              )}
            >
              <Menu aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <MobileDrawer
          onClose={() => setMenuOpen(false)}
          branches={branches}
          selectedBranch={selectedBranch}
          pageBranchSlug={pageBranchSlug}
          nav={nav}
          utilities={utilities}
        />
      ) : null}
    </>
  );
}

function MobileDrawer({
  onClose,
  branches,
  selectedBranch,
  pageBranchSlug,
  nav,
  utilities,
}: {
  onClose: () => void;
  branches: ApiBranch[];
  selectedBranch: ApiBranch | null;
  pageBranchSlug?: string;
  nav: NavLink[];
  utilities: NavLink[];
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/45"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col overflow-y-auto bg-ivory shadow-raised focus:outline-none"
      >
        <div className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-5">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center text-graphite hover:text-ink"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <nav aria-label="Mobile" className="flex flex-col px-5 py-4">
          {nav.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="border-b border-line py-4 font-display text-2xl text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {selectedBranch ? (
          <div className="border-b border-line px-5 py-4">
            <BranchSwitcher
              branches={branches}
              selected={selectedBranch}
              pageBranchSlug={pageBranchSlug}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-1 px-5 pb-4">
          {utilities.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-2 py-3 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-graphite"
            >
              <ShoppingBag aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-auto border-t border-line p-5">
          <Link
            href="/branches"
            className="flex min-h-12 w-full items-center justify-center border border-ink bg-ink px-6 py-3 font-sans text-xs font-medium uppercase tracking-[0.14em] text-ivory"
          >
            Find Your Gown
          </Link>
        </div>
      </div>
    </div>
  );
}
