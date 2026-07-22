"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { SlidersHorizontal, X, Search, Check } from "lucide-react";

import { cn } from "@/lib/cn";
import { tintForColour } from "@/config/media";
import { SORT_OPTIONS } from "@/config/site";
import { HORIZON_DAYS, HEALTH_BAND_LABELS } from "@/lib/domain/constants";
import { addDays, toDateKey } from "@/lib/domain/dates";
import type { ApiProductCard, ApiCollection } from "@/lib/api/contract";
import { Container, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { DragScroll } from "@/components/ui/drag-scroll";
import { Input, Select } from "@/components/ui/field";
import { ProductGrid, type CardAvailability } from "@/components/catalogue/product-card";
import { shopAvailability } from "@/app/(site)/shop/actions";

type Branch = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  country: string | null;
};

/**
 * Horizontal shop categories. Occasion is not a field in the one-of-one data
 * model, so each category matches best-effort against the gown's collection,
 * silhouette, colour and description. "All Dresses" clears the filter.
 */
const SHOP_CATEGORIES: Array<{ label: string; match: string[] | null }> = [
  { label: "All Dresses", match: null },
  { label: "Soirée", match: ["soir", "nocturne", "evening", "gala", "night"] },
  { label: "Evening Gowns", match: ["evening", "gown", "gala", "column", "mermaid"] },
  { label: "Engagement", match: ["engage", "blush", "rose", "pink"] },
  { label: "Wedding Guest", match: ["wedding", "guest", "champagne", "ivory", "white"] },
  { label: "Graduation", match: ["grad"] },
  { label: "Premium Edit", match: ["premium", "atelier", "edit", "couture", "cairo"] },
];

const DEFAULT_SORT = SORT_OPTIONS[0].value;

function haystack(p: ApiProductCard): string {
  return [p.code, p.colour, p.silhouette, p.fabric, p.collection?.name, p.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ShopClient({
  branch,
  products,
  collections,
}: {
  branch: Branch;
  products: ApiProductCard[];
  collections: ApiCollection[];
}) {
  // Applied filters — these drive the product grid.
  const [category, setCategory] = useState("All Dresses");
  const [colour, setColour] = useState("");
  const [collectionSlug, setCollectionSlug] = useState("");
  const [date, setDate] = useState("");
  const [availOnly, setAvailOnly] = useState(true);
  const [availIds, setAvailIds] = useState<Set<string> | null>(null);
  const [availWindow, setAvailWindow] = useState<{ handover: string; takeback: string } | null>(null);
  const [availError, setAvailError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Toolbar controls (live, outside the drawer).
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>(DEFAULT_SORT);

  // Draft filters — edited inside the drawer, committed on "Apply Filters".
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState(category);
  const [draftColour, setDraftColour] = useState(colour);
  const [draftCollection, setDraftCollection] = useState(collectionSlug);
  const [draftDate, setDraftDate] = useState(date);
  const [draftAvailOnly, setDraftAvailOnly] = useState(availOnly);

  const today = new Date();
  const minDate = toDateKey(today);
  const maxDate = toDateKey(addDays(today, HORIZON_DAYS));

  const colourOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.colour) set.add(p.colour);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [products]);

  /** Fetch (or clear) the free-date set for a chosen event date. */
  function commitAvailability(nextDate: string) {
    setAvailError(null);
    if (!nextDate) {
      setAvailIds(null);
      setAvailWindow(null);
      return;
    }
    startTransition(async () => {
      const res = await shopAvailability(branch.id, nextDate);
      if (!res.ok) {
        setAvailError(res.error);
        setAvailIds(null);
        setAvailWindow(null);
        return;
      }
      setAvailIds(new Set(res.ids));
      setAvailWindow({ handover: res.handover, takeback: res.takeback });
    });
  }

  // --- Drawer lifecycle -----------------------------------------------------

  function openDrawer() {
    // Seed the draft from the currently applied filters, so the drawer always
    // reopens showing what is in effect.
    setDraftCategory(category);
    setDraftColour(colour);
    setDraftCollection(collectionSlug);
    setDraftDate(date);
    setDraftAvailOnly(availOnly);
    setDrawerOpen(true);
  }

  function applyFilters() {
    setCategory(draftCategory);
    setColour(draftColour);
    setCollectionSlug(draftCollection);
    setAvailOnly(draftAvailOnly);
    // Only hit the availability endpoint when the date actually changed.
    if (draftDate !== date) {
      setDate(draftDate);
      commitAvailability(draftDate);
    }
    setDrawerOpen(false);
  }

  /** Reset the draft fields inside the drawer (does not apply until "Apply"). */
  function clearDraftFilters() {
    setDraftCategory("All Dresses");
    setDraftColour("");
    setDraftCollection("");
    setDraftDate("");
    setDraftAvailOnly(true);
  }

  /** Clear the applied filters (used from the toolbar / empty state). */
  function resetFilters() {
    setCategory("All Dresses");
    setColour("");
    setCollectionSlug("");
    setDate("");
    setAvailOnly(true);
    setAvailIds(null);
    setAvailWindow(null);
    setAvailError(null);
  }

  const filtered = useMemo(() => {
    let list = products;

    const cat = SHOP_CATEGORIES.find((c) => c.label === category);
    if (cat?.match) {
      const keywords = cat.match;
      list = list.filter((p) => keywords.some((k) => haystack(p).includes(k)));
    }
    if (colour) {
      list = list.filter((p) => (p.colour ?? "").toLowerCase() === colour.toLowerCase());
    }
    if (collectionSlug) {
      list = list.filter((p) => p.collection?.slug === collectionSlug);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => haystack(p).includes(q));
    }
    if (date && availOnly && availIds) {
      list = list.filter((p) => availIds.has(p.id));
    }

    const sorted = [...list];
    if (sort === "price_asc") {
      sorted.sort(
        (a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY),
      );
    } else if (sort === "price_desc") {
      sorted.sort(
        (a, b) => (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY),
      );
    }
    return sorted;
  }, [products, category, colour, collectionSlug, search, date, availOnly, availIds, sort]);

  // Active *filter* count (drawer filters only — search and sort are separate).
  const activeCount = [
    category !== "All Dresses",
    colour !== "",
    collectionSlug !== "",
    date !== "",
  ].filter(Boolean).length;

  // Availability annotation for a card, given the current date filter.
  function availabilityFor(p: ApiProductCard): CardAvailability {
    if (!date || !availIds) {
      return { label: `Condition: ${HEALTH_BAND_LABELS[p.healthBand]}`, free: null };
    }
    return availIds.has(p.id)
      ? { label: "Available on your date", free: true }
      : { label: "Not available that night", free: false };
  }

  return (
    <>
      {/* 1. Small header ---------------------------------------------------- */}
      <Container className="pt-8 lg:pt-10">
        <h1 className="font-display text-[2.1rem] leading-[1.1] text-ink sm:text-[2.75rem]">
          Shop the Collection
        </h1>
        <p className="mt-4 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-graphite">
          {branch.name}
        </p>
      </Container>

      {/* 2. Horizontal categories ------------------------------------------ */}
      <div className="mt-8 border-y border-line">
        <Container>
          <DragScroll className="-mx-1 flex gap-2 overflow-x-auto py-4">
            {SHOP_CATEGORIES.map((c) => {
              const active = category === c.label;
              return (
                <li key={c.label} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setCategory(c.label)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex min-h-10 items-center whitespace-nowrap border px-4 py-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.12em] transition-colors",
                      active
                        ? "border-ink bg-ink text-ivory"
                        : "border-line-strong text-charcoal hover:border-ink hover:text-ink",
                    )}
                  >
                    {c.label}
                  </button>
                </li>
              );
            })}
          </DragScroll>
        </Container>
      </div>

      {/* 3. Compact toolbar: search · sort · filters ----------------------- */}
      <Container className="py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="shop-search" className="sr-only">
              Search gowns
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist"
              strokeWidth={1.5}
            />
            <Input
              id="shop-search"
              type="search"
              placeholder="Search gowns, colours, collections…"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 sm:w-52 sm:flex-none">
              <label htmlFor="shop-sort" className="sr-only">
                Sort by
              </label>
              <Select
                id="shop-sort"
                value={sort}
                onChange={(e) => setSort(e.currentTarget.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={openDrawer}
              aria-haspopup="dialog"
              aria-expanded={drawerOpen}
              className="shrink-0"
            >
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
              Filters
              {activeCount > 0 ? (
                <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-deep px-1 text-[0.625rem] font-semibold text-white">
                  {activeCount}
                </span>
              ) : null}
            </Button>
          </div>
        </div>

        {/* Result count + quick clear. */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-sm text-stone" aria-live="polite">
            {pending
              ? "Checking availability…"
              : `${filtered.length} ${filtered.length === 1 ? "gown" : "gowns"}`}
            {availWindow && date && !pending ? (
              <span className="ml-2 text-mist">
                · collect {availWindow.handover}, return {availWindow.takeback}
              </span>
            ) : null}
          </p>
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={resetFilters}
              className="link-underline font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </Container>

      {/* 4. Product grid ---------------------------------------------------- */}
      <Container className="pb-16 lg:pb-24">
        {availError ? (
          <p className="mb-6 border-l-2 border-danger bg-danger-soft px-4 py-3 text-sm text-danger">
            {availError}
          </p>
        ) : null}

        {filtered.length > 0 ? (
          <ProductGrid
            products={filtered}
            priorityCount={4}
            availabilityFor={availabilityFor}
          />
        ) : (
          <EmptyState
            title="No gowns match those filters"
            body="Try a different occasion, colour or date — or clear the filters to see the full wardrobe at this branch."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  resetFilters();
                  setSearch("");
                }}
              >
                Clear Filters
              </Button>
            }
          />
        )}
      </Container>

      {/* Filter drawer (all breakpoints) ----------------------------------- */}
      {drawerOpen ? (
        <FilterDrawer onClose={() => setDrawerOpen(false)} onClear={clearDraftFilters} onApply={applyFilters}>
          <FilterField label="Event Date" htmlFor="f-date" hint={`Up to ${HORIZON_DAYS} days ahead`}>
            <Input
              id="f-date"
              type="date"
              min={minDate}
              max={maxDate}
              value={draftDate}
              onChange={(e) => setDraftDate(e.currentTarget.value)}
            />
          </FilterField>

          <fieldset className="flex flex-col gap-3 border-0 p-0">
            <legend className="mb-1 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-graphite">
              Colour
            </legend>
            <ColourSwatches
              options={colourOptions}
              value={draftColour}
              onChange={setDraftColour}
            />
          </fieldset>

          <FilterField label="Occasion" htmlFor="f-occasion">
            <Select
              id="f-occasion"
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.currentTarget.value)}
            >
              {SHOP_CATEGORIES.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Collection" htmlFor="f-collection">
            <Select
              id="f-collection"
              value={draftCollection}
              onChange={(e) => setDraftCollection(e.currentTarget.value)}
            >
              <option value="">All collections</option>
              {collections.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField
            label="Availability"
            htmlFor="f-availability"
            hint={draftDate ? undefined : "Pick an event date first"}
          >
            <Select
              id="f-availability"
              value={draftAvailOnly ? "available" : "all"}
              onChange={(e) => setDraftAvailOnly(e.currentTarget.value === "available")}
              disabled={!draftDate}
            >
              <option value="available">Available for my date</option>
              <option value="all">Show all gowns</option>
            </Select>
          </FilterField>
        </FilterDrawer>
      ) : null}
    </>
  );
}

// --- Colour swatches --------------------------------------------------------
// Large square swatches showing the actual colour. Toggle a selected swatch to
// clear it. A thin border keeps light colours visible; the active swatch gets a
// black outline and a small check.

function ColourSwatches({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) {
  if (options.length === 0) {
    return <p className="text-xs text-mist">No colours to filter at this branch.</p>;
  }

  return (
    <ul className="grid grid-cols-4 gap-x-3 gap-y-4">
      {options.map((c) => {
        const selected = value === c;
        return (
          <li key={c}>
            <button
              type="button"
              onClick={() => onChange(selected ? "" : c)}
              aria-pressed={selected}
              aria-label={titleCase(c)}
              className="group flex w-full flex-col items-center gap-2 focus:outline-none"
            >
              <span
                className={cn(
                  "relative aspect-square w-full transition-[border-color,box-shadow] duration-200",
                  "group-focus-visible:ring-2 group-focus-visible:ring-gold group-focus-visible:ring-offset-2",
                  selected
                    ? "border-2 border-ink shadow-subtle"
                    : "border border-line-strong group-hover:border-stone",
                )}
                style={{ backgroundColor: tintForColour(c) }}
              >
                {selected ? (
                  <span className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-ink text-ivory">
                    <Check aria-hidden="true" className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "text-center text-[0.6875rem] leading-tight",
                  selected ? "font-medium text-ink" : "text-stone",
                )}
              >
                {titleCase(c)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// --- Filter label wrapper (no "(optional)" noise) ---------------------------

function FilterField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-graphite"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-mist">{hint}</p> : null}
    </div>
  );
}

// --- Filter drawer ----------------------------------------------------------
// Right-side overlay on desktop; full-width sheet on phones. Edits stay local
// to the drawer (draft state) until "Apply Filters" commits them.

function FilterDrawer({
  onClose,
  onClear,
  onApply,
  children,
}: {
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

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
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/45"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory shadow-raised focus:outline-none"
      >
        <div className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-5">
          <h2 className="font-display text-xl text-ink">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-11 w-11 items-center justify-center text-graphite hover:text-ink"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-6">
          {children}
        </div>

        <div className="flex items-center gap-3 border-t border-line p-5">
          <Button type="button" variant="secondary" onClick={onClear} className="flex-1">
            Clear All
          </Button>
          <Button type="button" onClick={onApply} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
