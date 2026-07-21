"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Reusable, accessible date picker with a custom RS Atelier calendar.
 *
 * The native date picker is deliberately NOT used. Only dates in
 * `availableDates` (within [min, max]) can be selected; everything else — past
 * dates, dates outside the window, and unavailable dates — is disabled and
 * impossible to click. Selecting is read-only: it reports a date, it never
 * books, holds or records anything.
 *
 * Keyboard: arrow keys move between available dates, Enter/Space selects, Escape
 * closes. Focus moves into the calendar on open and returns to the field on
 * close.
 */

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const partsOf = (key: string) => ({
  y: +key.slice(0, 4),
  m: +key.slice(5, 7) - 1,
  d: +key.slice(8, 10),
});
function shiftKey(key: string, days: number): string {
  const { y, m, d } = partsOf(key);
  const dt = new Date(y, m, d + days);
  return keyOf(dt.getFullYear(), dt.getMonth(), dt.getDate());
}
const asDate = (key: string) => {
  const { y, m, d } = partsOf(key);
  return new Date(y, m, d);
};
const monthLabel = (y: number, m: number) =>
  new Date(y, m, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
const longDate = (key: string) =>
  asDate(key).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
export const displayDate = (key: string) =>
  asDate(key).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function DatePicker({
  value,
  onChange,
  availableDates,
  min,
  max,
  id,
  placeholder = "Select a date",
  ariaLabel = "Event date",
}: {
  value: string | null;
  onChange: (key: string) => void;
  availableDates: Set<string>;
  min: string;
  max: string;
  id?: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-14 w-full items-center gap-3 border bg-offwhite px-4 text-left font-sans text-base transition-colors",
          open ? "border-gold" : "border-line-strong hover:border-stone",
          "focus:border-gold focus:outline-none",
        )}
      >
        <CalendarDays aria-hidden="true" className="h-5 w-5 shrink-0 text-gold-deep" strokeWidth={1.5} />
        <span className={value ? "text-ink" : "text-mist"}>
          {value ? displayDate(value) : placeholder}
        </span>
      </button>

      {open ? (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-ink/40 sm:hidden"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Choose an event date"
            className={cn(
              "z-50 border border-line bg-ivory p-4 shadow-raised",
              "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0",
              "sm:absolute sm:mt-2 sm:w-[20.5rem]",
            )}
          >
            <CalendarGrid
              value={value}
              availableDates={availableDates}
              min={min}
              max={max}
              onSelect={(k) => {
                onChange(k);
                setOpen(false);
                triggerRef.current?.focus();
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function CalendarGrid({
  value,
  availableDates,
  min,
  max,
  onSelect,
}: {
  value: string | null;
  availableDates: Set<string>;
  min: string;
  max: string;
  onSelect: (key: string) => void;
}) {
  const availSorted = useMemo(
    () => [...availableDates].filter((k) => k >= min && k <= max).sort(),
    [availableDates, min, max],
  );

  const initial =
    value && availableDates.has(value) && value >= min && value <= max
      ? value
      : availSorted[0] ?? min;

  const [focusKey, setFocusKey] = useState(initial);
  const [view, setView] = useState(() => {
    const p = partsOf(initial);
    return { y: p.y, m: p.m };
  });
  const gridRef = useRef<HTMLDivElement>(null);

  // Move DOM focus onto the roving cell (on open and on keyboard navigation).
  useEffect(() => {
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-key="${focusKey}"]`)
      ?.focus();
  }, [focusKey, view.y, view.m]);

  const minMonth = min.slice(0, 7);
  const maxMonth = max.slice(0, 7);
  const viewMonth = `${view.y}-${pad(view.m + 1)}`;
  const canPrev = viewMonth > minMonth;
  const canNext = viewMonth < maxMonth;

  function focusOn(key: string | null) {
    if (!key || key < min || key > max) return;
    setFocusKey(key);
    const p = partsOf(key);
    if (p.y !== view.y || p.m !== view.m) setView({ y: p.y, m: p.m });
  }
  const nextAvail = (after: string) => availSorted.find((k) => k > after) ?? null;
  const prevAvail = (before: string) => {
    for (let i = availSorted.length - 1; i >= 0; i--) if (availSorted[i] < before) return availSorted[i];
    return null;
  };

  function onKeyDown(e: React.KeyboardEvent) {
    let target: string | null = null;
    switch (e.key) {
      case "ArrowRight":
        target = nextAvail(focusKey);
        break;
      case "ArrowLeft":
        target = prevAvail(focusKey);
        break;
      case "ArrowDown": {
        const from = shiftKey(focusKey, 7);
        target = availSorted.find((k) => k >= from) ?? null;
        break;
      }
      case "ArrowUp": {
        const to = shiftKey(focusKey, -7);
        for (let i = availSorted.length - 1; i >= 0; i--)
          if (availSorted[i] <= to) {
            target = availSorted[i];
            break;
          }
        break;
      }
      case "Home":
        target = availSorted.find((k) => k.slice(0, 7) === viewMonth) ?? null;
        break;
      case "End": {
        const inMonth = availSorted.filter((k) => k.slice(0, 7) === viewMonth);
        target = inMonth[inMonth.length - 1] ?? null;
        break;
      }
      case "Enter":
      case " ":
        e.preventDefault();
        if (availableDates.has(focusKey)) onSelect(focusKey);
        return;
      default:
        return;
    }
    e.preventDefault();
    if (target) focusOn(target);
  }

  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canPrev}
          onClick={() => {
            const m = view.m - 1;
            setView(m < 0 ? { y: view.y - 1, m: 11 } : { y: view.y, m });
          }}
          className="flex h-9 w-9 items-center justify-center text-graphite transition-colors hover:text-ink disabled:cursor-not-allowed disabled:text-mist/40"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <span aria-live="polite" className="font-display text-lg text-ink">
          {monthLabel(view.y, view.m)}
        </span>
        <button
          type="button"
          aria-label="Next month"
          disabled={!canNext}
          onClick={() => {
            const m = view.m + 1;
            setView(m > 11 ? { y: view.y + 1, m: 0 } : { y: view.y, m });
          }}
          className="flex h-9 w-9 items-center justify-center text-graphite transition-colors hover:text-ink disabled:cursor-not-allowed disabled:text-mist/40"
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <div role="grid" aria-label="Available dates" ref={gridRef} onKeyDown={onKeyDown}>
        <div role="row" className="grid grid-cols-7">
          {WEEKDAYS.map((w) => (
            <span
              key={w}
              role="columnheader"
              className="flex h-8 items-center justify-center font-sans text-[0.625rem] font-medium uppercase tracking-[0.08em] text-mist"
            >
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <span key={`e${i}`} aria-hidden="true" />;
            const key = keyOf(view.y, view.m, d);
            const selectable = availableDates.has(key) && key >= min && key <= max;
            const selected = key === value;
            return (
              <button
                key={key}
                data-key={key}
                type="button"
                role="gridcell"
                disabled={!selectable}
                tabIndex={key === focusKey ? 0 : -1}
                aria-label={`${longDate(key)}${selectable ? "" : ", not available"}`}
                aria-selected={selected}
                title={selectable ? undefined : "Not available"}
                onClick={() => selectable && onSelect(key)}
                className={cn(
                  "flex h-9 items-center justify-center border text-sm transition-colors",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1",
                  selected
                    ? "border-ink bg-ink font-medium text-white"
                    : selectable
                      ? "border-transparent text-ink hover:border-gold/40 hover:bg-gold-soft/50"
                      : "cursor-not-allowed border-transparent text-mist/40",
                )}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 font-sans text-[0.6875rem] text-stone">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-3.5 w-3.5 border border-line-strong bg-offwhite" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-3.5 w-3.5 border border-line bg-ivory-deep opacity-60" />
          Unavailable
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-3.5 w-3.5 bg-ink" />
          Selected
        </span>
      </div>
    </div>
  );
}
