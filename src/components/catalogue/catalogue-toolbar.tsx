"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";

import { Select } from "@/components/ui/field";

/** Sort control. The URL stays the source of truth, so views are shareable. */
export function CatalogueToolbar({
  branchSlug,
  sortOptions,
  currentSort,
  currentCollection,
}: {
  branchSlug: string;
  sortOptions: Array<{ value: string; label: string }>;
  currentSort?: string;
  currentCollection?: string;
}) {
  const router = useRouter();
  const id = useId();

  return (
    <div className="mb-8 flex flex-wrap items-center justify-end gap-3 border-b border-line pb-5">
      <label
        htmlFor={id}
        className="font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-stone"
      >
        Sort by
      </label>
      <Select
        id={id}
        className="w-56"
        value={currentSort ?? sortOptions[0]?.value}
        onChange={(event) => {
          const params = new URLSearchParams();
          if (currentCollection) params.set("collection", currentCollection);
          params.set("sort", event.currentTarget.value);
          router.push(`/branches/${branchSlug}?${params.toString()}`);
        }}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
