"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";

import { cn } from "@/lib/cn";
import type { ApiBranch } from "@/lib/api/contract";
import { branchDisplayName } from "@/lib/branch-name";
import { selectBranch } from "@/app/(site)/branch-actions";

/**
 * Compact "Exploring: X" chip in the header.
 *
 * Switching branch reloads the whole tree, because the catalogue, availability
 * and contact details are all scoped to one branch. If the customer is looking
 * at a gown that belongs to the branch they are leaving, they are moved to the
 * new branch's wardrobe rather than left on a page that no longer applies.
 */
export function BranchSwitcher({
  branches,
  selected,
  onDark = false,
  /** Slug of the branch the current page belongs to, when it belongs to one. */
  pageBranchSlug,
  className,
  triggerClassName,
}: {
  branches: ApiBranch[];
  selected: ApiBranch;
  onDark?: boolean;
  pageBranchSlug?: string;
  /** Applied to the root, e.g. to let the switcher flex-grow on mobile. */
  className?: string;
  /** Applied to the trigger button, e.g. to make it fill and truncate. */
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchTo(slug: string) {
    if (slug === selected.slug) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const result = await selectBranch(slug);
      setOpen(false);
      if (!result.ok) return;

      // The current page belongs to the branch being left, so its content no
      // longer applies — send the customer to the new wardrobe instead.
      if (pageBranchSlug && pageBranchSlug !== slug) {
        router.push(`/branches/${result.slug}`);
      }
      router.refresh();
    });
  }

  if (branches.length === 0) return null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex min-h-11 max-w-[10rem] items-center gap-1.5 px-2 py-1.5 sm:max-w-[16rem]",
          "font-sans text-[0.6875rem] font-medium uppercase tracking-[0.12em]",
          "transition-colors duration-300 disabled:opacity-60",
          onDark
            ? "text-white/85 hover:text-white"
            : "text-graphite hover:text-ink",
          triggerClassName,
        )}
      >
        <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
        <span className="sr-only">Currently exploring. Change branch.</span>
        <span className="min-w-0 truncate font-semibold">
          {branchDisplayName(selected)}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
          strokeWidth={1.5}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Choose a branch"
          className="animate-dropdown absolute right-0 top-full z-50 mt-1 w-64 border border-line bg-offwhite shadow-raised"
        >
          <p className="border-b border-line px-4 py-3 text-[0.625rem] uppercase tracking-[0.14em] text-stone">
            Explore another branch
          </p>
          <ul>
            {branches.map((branch) => {
              const isCurrent = branch.slug === selected.slug;
              return (
                <li key={branch.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isCurrent}
                    onClick={() => switchTo(branch.slug)}
                    disabled={pending}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                      "hover:bg-ivory-deep disabled:opacity-60",
                      isCurrent && "bg-ivory-deep",
                    )}
                  >
                    <span className="mt-0.5 w-4 shrink-0">
                      {isCurrent ? (
                        <Check
                          aria-hidden="true"
                          className="h-4 w-4 text-gold-deep"
                          strokeWidth={2}
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink">
                        {branch.name}
                      </span>
                      {branch.location ? (
                        <span className="mt-0.5 block truncate text-xs text-stone">
                          {branch.location}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-mist">
            Changing branch reloads the wardrobe. Gowns are never mixed between
            branches.
          </p>
        </div>
      ) : null}
    </div>
  );
}
