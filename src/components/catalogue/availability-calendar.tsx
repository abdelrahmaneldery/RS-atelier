"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { HORIZON_DAYS } from "@/lib/domain/constants";
import { addDays, fromDateKey, toDateKey } from "@/lib/domain/dates";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Dress → free dates (§5 mode 1).
 *
 * One premium date input bounded to the booking horizon. Choosing a date and
 * pressing "Check Availability" reveals whether that night is free — advisory,
 * exactly as before: the free-date set and window derivation are unchanged, and
 * create still recomputes and re-checks for clashes on the server.
 */
export function AvailabilityCalendar({
  productSlug,
  freeDates,
  canBook,
  similarHref,
}: {
  productSlug: string;
  freeDates: string[];
  /** False when the dress has no public price and cannot be self-booked. */
  canBook: boolean;
  /** Where "View Similar Dresses" leads (this dress's branch wardrobe). */
  similarHref: string;
}) {
  const router = useRouter();
  const free = useMemo(() => new Set(freeDates), [freeDates]);

  const [date, setDate] = useState("");
  const [checked, setChecked] = useState<{ date: string; available: boolean } | null>(null);

  const today = new Date();
  const min = toDateKey(today);
  const max = toDateKey(addDays(today, HORIZON_DAYS));

  if (freeDates.length === 0) {
    return (
      <div className="mt-6 border border-line bg-offwhite px-5 py-6">
        <p className="text-sm leading-relaxed text-graphite">
          This gown has no free dates in the next {HORIZON_DAYS} days. It may be
          booked, or being cleaned between rentals.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Leave your details below and the branch will let you know when it is
          free again.
        </p>
      </div>
    );
  }

  function check(event: React.FormEvent) {
    event.preventDefault();
    if (!date || date < min || date > max) return;
    setChecked({ date, available: free.has(date) });
  }

  return (
    <div className="mt-6">
      <form onSubmit={check} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="check-date"
            className="mb-2 block font-sans text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-graphite"
          >
            Event Date
          </label>
          <div className="relative">
            <CalendarDays
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-deep"
              strokeWidth={1.5}
            />
            <input
              id="check-date"
              type="date"
              min={min}
              max={max}
              value={date}
              onChange={(e) => {
                setDate(e.currentTarget.value);
                setChecked(null);
              }}
              onClick={(e) => e.currentTarget.showPicker?.()}
              className={cn(
                "h-14 w-full border border-line-strong bg-offwhite pl-12 pr-4 font-sans text-base text-ink",
                "transition-colors hover:border-stone focus:border-gold focus:outline-none focus:ring-0",
                // The whole field opens the native picker on click.
                "[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0",
                "[&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full",
                "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
              )}
            />
          </div>
        </div>
        <Button type="submit" size="lg" disabled={!date} className="h-14 disabled:opacity-100">
          Check Availability
        </Button>
      </form>

      {checked ? (
        checked.available ? (
          <AvailableResult
            selected={checked.date}
            canBook={canBook}
            onBook={() =>
              router.push(`/book/${productSlug}?date=${encodeURIComponent(checked.date)}`)
            }
          />
        ) : (
          <UnavailableResult
            similarHref={similarHref}
            onChooseAnother={() => {
              setChecked(null);
              setDate("");
            }}
          />
        )
      ) : (
        <p className="mt-5 text-sm text-stone">
          Choose your event date to see collection and return days.
        </p>
      )}
    </div>
  );
}

function AvailableResult({
  selected,
  canBook,
  onBook,
}: {
  selected: string;
  canBook: boolean;
  onBook: () => void;
}) {
  const eventDate = fromDateKey(selected);
  if (!eventDate) return null;

  // Mirrors the server's derivation (§4). The server recomputes it on create.
  const handover = addDays(eventDate, -1);
  const takeback = addDays(eventDate, 1);

  return (
    <div className="mt-6 border border-gold/40 bg-sand/50 px-6 py-6">
      <h3 className="font-display text-2xl text-ink">Available for Your Event</h3>

      <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-4 text-sm">
        <div>
          <dt className="eyebrow">Event Date</dt>
          <dd className="mt-1 text-charcoal">{formatDate(eventDate)}</dd>
        </div>
        <div>
          <dt className="eyebrow">Collection Date</dt>
          <dd className="mt-1 text-charcoal">{formatDate(handover)}</dd>
        </div>
        <div>
          <dt className="eyebrow">Return Date</dt>
          <dd className="mt-1 text-charcoal">{formatDate(takeback)}</dd>
        </div>
      </dl>

      {canBook ? (
        <Button type="button" size="lg" className="mt-6" onClick={onBook}>
          Reserve This Dress
        </Button>
      ) : (
        <p className="mt-5 text-sm leading-relaxed text-graphite">
          This gown cannot be reserved online yet. Leave your details below and
          the branch will contact you.
        </p>
      )}
    </div>
  );
}

function UnavailableResult({
  similarHref,
  onChooseAnother,
}: {
  similarHref: string;
  onChooseAnother: () => void;
}) {
  return (
    <div className="mt-6 border border-line bg-offwhite px-6 py-6">
      <h3 className="font-display text-2xl text-ink">Not Available for This Date</h3>
      <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-stone">
        This gown is spoken for around that date. Try another evening, or explore
        other gowns at this branch.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="secondary" onClick={onChooseAnother}>
          Choose Another Date
        </Button>
        <ButtonLink href={similarHref} variant="secondary">
          View Similar Dresses
        </ButtonLink>
      </div>
    </div>
  );
}
