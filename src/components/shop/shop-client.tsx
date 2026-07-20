"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { SlidersHorizontal, X, Search } from "lucide-react";

import { cn } from "@/lib/cn";
import { SORT_OPTIONS } from "@/config/site";
import { HORIZON_DAYS, HEALTH_BAND_LABELS } from "@/lib/domain/constants";
import { addDays, toDateKey } from "@/lib/domain/dates";
import type { ApiProductCard, ApiCollection } from "@/lib/api/contract";
import { Container, Eyebrow, EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
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
  const [category, setCategory] = useState("All Dresses");
  const [search, setSearch] = useState("");
  const [colour, setColour] = useState("");
  const [collectionSlug, setCollectionSlug] = useState("");
  const [sort, setSort] = useState<string>(DEFAULT_SORT);
  const [date, setDate] = useState("");
  const [availOnly, setAvailOnly] = useState(true);
  const [availIds, setAvailIds] = useState<Set<string> | null>(null);
  const [availWindow, setAvailWindow] = useState<{ handover: string; takeback: string } | null>(null);
  const [availError, setAvailError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const today = new Date();
  const minDate = toDateKey(today);
  const maxDate = toDateKey(addDays(today, HORIZON_DAYS));

  const colourOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.colour) set.add(p.colour);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [products]);

  function runAvailability(value: string) {
    setDate(value);
    setAvailError(null);
    if (!value) {
      setAvailIds(null);
      setAvailWindow(null);
      return;
    }
    startTransition(async () => {
      const res = await shopAvailability(branch.id, value);
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

  const hasActiveFilters =
    category !== "All Dresses" ||
    search.trim() !== "" ||
    colour !== "" ||
    collectionSlug !== "" ||
    date !== "" ||
    sort !== DEFAULT_SORT;

  const activeCount = [
    category !== "All Dresses",
    colour !== "",
    collectionSlug !== "",
    date !== "",
  ].filter(Boolean).length;

  function clearAll() {
    setCategory("All Dresses");
    setSearch("");
    setColour("");
    setCollectionSlug("");
    setSort(DEFAULT_SORT);
    setDate("");
    setAvailOnly(true);
    setAvailIds(null);
    setAvailWindow(null);
    setAvailError(null);
  }

  // Availability annotation for a card, given the current date filter.
  function availabilityFor(p: ApiProductCard): CardAvailability {
    if (!date || !availIds) {
      return { label: `Condition: ${HEALTH_BAND_LABELS[p.healthBand]}`, free: null };
    }
    return availIds.has(p.id)
      ? { label: "Free on your date", free: true }
      : { label: "Not free that night", free: false };
  }

  function reserveHref(p: ApiProductCard): string {
    return date && availIds?.has(p.id)
      ? `/book/${p.slug}?date=${date}`
      : `/dresses/${p.slug}`;
  }

  /** The advanced filter fields — rendered inline on desktop, in the drawer on mobile. */
  function advancedFilters(prefix: string) {
    return (
      <>
        <FilterField label="Event Date" htmlFor={`${prefix}-date`} hint={`Up to ${HORIZON_DAYS} days ahead`}>
          <Input
            id={`${prefix}-date`}
            type="date"
            min={minDate}
            max={maxDate}
            value={date}
            onChange={(e) => runAvailability(e.currentTarget.value)}
          />
        </FilterField>

        <FilterField label="Colour" htmlFor={`${prefix}-colour`}>
          <Select
            id={`${prefix}-colour`}
            value={colour}
            onChange={(e) => setColour(e.currentTarget.value)}
          >
            <option value="">All colours</option>
            {colourOptions.map((c) => (
              <option key={c} value={c}>
                {titleCase(c)}
              </option>
            ))}
          </Select>
        </FilterField>

        <FilterField label="Occasion" htmlFor={`${prefix}-occasion`}>
          <Select
            id={`${prefix}-occasion`}
            value={category}
            onChange={(e) => setCategory(e.currentTarget.value)}
          >
            {SHOP_CATEGORIES.map((c) => (
              <option key={c.label} value={c.label}>
                {c.label}
              </option>
            ))}
          </Select>
        </FilterField>

        <FilterField label="Collection" htmlFor={`${prefix}-collection`}>
          <Select
            id={`${prefix}-collection`}
            value={collectionSlug}
            onChange={(e) => setCollectionSlug(e.currentTarget.value)}
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
          htmlFor={`${prefix}-availability`}
          hint={date ? undefined : "Pick an event date first"}
        >
          <Select
            id={`${prefix}-availability`}
            value={availOnly ? "available" : "all"}
            onChange={(e) => setAvailOnly(e.currentTarget.value === "available")}
            disabled={!date}
          >
            <option value="available">Available for my date</option>
            <option value="all">Show all gowns</option>
          </Select>
        </FilterField>
      </>
    );
  }

  return (
    <>
      {/* 1. Small header ---------------------------------------------------- */}
      <Container size="wide" className="pt-8 lg:pt-10">
        <Eyebrow gold>The Wardrobe</Eyebrow>
        <h1 className="mt-4 font-display text-[2.1rem] leading-[1.1] text-ink sm:text-[2.75rem]">
          Shop the Collection
        </h1>
        <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-stone">
          One-of-one gowns held at this branch and collected here. Choose your
          date and reserve the piece for the night — no cart, no checkout.
        </p>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-mist">
          <span className="text-graphite">{branch.name}</span>
          <span aria-hidden="true">·</span>
          <span>
            {products.length} {products.length === 1 ? "gown" : "gowns"}
          </span>
        </p>
      </Container>

      {/* 2. Horizontal categories ------------------------------------------ */}
      <div className="mt-8 border-y border-line">
        <Container size="wide">
          <ul className="-mx-1 flex gap-2 overflow-x-auto py-4">
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
          </ul>
        </Container>
      </div>

      {/* 3. Search + filters ------------------------------------------------ */}
      <Container size="wide" className="py-6">
        <div className="flex flex-col gap-4">
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
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden"
              >
                <SlidersHorizontal aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                Filters
                {activeCount > 0 ? (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center bg-ink px-1 text-[0.625rem] text-ivory">
                    {activeCount}
                  </span>
                ) : null}
              </Button>
              <div className="min-w-0 flex-1 sm:w-56 sm:flex-none">
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
            </div>
          </div>

          {/* Advanced filters — inline on desktop only. */}
          <div className="hidden gap-3 lg:grid lg:grid-cols-5">{advancedFilters("d")}</div>

          {/* Result count + clear. */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-sm text-stone" aria-live="polite">
              {pending ? "Checking availability…" : `${filtered.length} ${filtered.length === 1 ? "gown" : "gowns"}`}
              {availWindow && date && !pending ? (
                <span className="ml-2 text-mist">
                  · collect {availWindow.handover}, return {availWindow.takeback}
                </span>
              ) : null}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearAll}
                className="link-underline font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      </Container>

      {/* 4. Product grid ---------------------------------------------------- */}
      <Container size="wide" className="pb-16 lg:pb-24">
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
            reserveHrefFor={reserveHref}
          />
        ) : (
          <EmptyState
            title="No gowns match those filters"
            body="Try a different occasion, colour or date — or clear the filters to see the full wardrobe at this branch."
            action={
              <Button type="button" variant="secondary" onClick={clearAll}>
                Clear Filters
              </Button>
            }
          />
        )}
      </Container>

      {/* Mobile filter drawer ---------------------------------------------- */}
      {drawerOpen ? (
        <FilterDrawer
          onClose={() => setDrawerOpen(false)}
          onClear={clearAll}
          hasActiveFilters={hasActiveFilters}
          resultCount={filtered.length}
        >
          {advancedFilters("m")}
        </FilterDrawer>
      ) : null}
    </>
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

// --- Mobile filter drawer ---------------------------------------------------

function FilterDrawer({
  onClose,
  onClear,
  hasActiveFilters,
  resultCount,
  children,
}: {
  onClose: () => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
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
    <div className="fixed inset-0 z-[70] lg:hidden">
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
        className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-ivory shadow-raised focus:outline-none"
      >
        <div className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-5">
          <span className="font-display text-xl text-ink">Filters</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-11 w-11 items-center justify-center text-graphite hover:text-ink"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-6">
          {children}
        </div>

        <div className="flex items-center gap-3 border-t border-line p-5">
          {hasActiveFilters ? (
            <Button type="button" variant="ghost" onClick={onClear} className="flex-1">
              Clear
            </Button>
          ) : null}
          <Button type="button" onClick={onClose} className="flex-1">
            Show {resultCount} {resultCount === 1 ? "Gown" : "Gowns"}
          </Button>
        </div>
      </div>
    </div>
  );
}
