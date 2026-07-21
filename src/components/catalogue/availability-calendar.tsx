"use client";

import { useState, useTransition } from "react";

import { HORIZON_DAYS } from "@/lib/domain/constants";
import { addDays, toDateKey } from "@/lib/domain/dates";
import { Button, ButtonLink } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { recheckProductDates } from "@/app/(site)/dresses/actions";

/**
 * Dress → availability check (guidance only), with a custom RS Atelier calendar.
 *
 * The customer picks an available event date and checks whether this gown is
 * free at the selected branch for it. This is READ-ONLY: it never changes the
 * dress status, holds the gown, or creates any booking or customer record.
 * Only available dates can be selected; on "Check Availability" the site
 * re-reads live availability, so a date that has since been taken is caught and
 * disabled. Reserving is arranged with the branch team.
 */
const GUIDANCE_NOTE =
  "Availability is shown for guidance only and is confirmed by the branch team.";

export function AvailabilityCalendar({
  productSlug,
  freeDates,
  similarHref,
  contactHref = "/contact",
  requestCallHref = "#request-a-call",
}: {
  productSlug: string;
  freeDates: string[];
  /** Where "View Similar Dresses" leads (this dress's branch wardrobe). */
  similarHref: string;
  /** "Contact the Branch" target. */
  contactHref?: string;
  /** "Request a Call" target (defaults to the on-page enquiry form). */
  requestCallHref?: string;
}) {
  const [available, setAvailable] = useState<Set<string>>(() => new Set(freeDates));
  const [date, setDate] = useState<string | null>(null);
  const [checked, setChecked] = useState<{ available: boolean; changed?: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  const today = new Date();
  const min = toDateKey(today);
  const max = toDateKey(addDays(today, HORIZON_DAYS));

  if (freeDates.length === 0) {
    return (
      <div className="mt-6 border border-line bg-offwhite px-5 py-6">
        <p className="text-sm leading-relaxed text-graphite">
          This gown has no available dates in the next {HORIZON_DAYS} days. It may
          be reserved, or being prepared between rentals.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Leave your details below and the branch will let you know when it is
          available again.
        </p>
        <p className="mt-4 text-xs leading-relaxed text-mist">{GUIDANCE_NOTE}</p>
      </div>
    );
  }

  function check(event: React.FormEvent) {
    event.preventDefault();
    if (!date) return;
    const chosen = date;
    startTransition(async () => {
      const fresh = await recheckProductDates(productSlug);
      if (fresh) {
        const freshSet = new Set(fresh);
        setAvailable(freshSet);
        if (!freshSet.has(chosen)) {
          // Availability changed since the page loaded — disable that date.
          setChecked({ available: false, changed: true });
          return;
        }
      }
      setChecked({ available: true });
    });
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
          <DatePicker
            id="check-date"
            value={date}
            onChange={(key) => {
              setDate(key);
              setChecked(null);
            }}
            availableDates={available}
            min={min}
            max={max}
            ariaLabel="Event date"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={!date || pending}
          className="h-14 disabled:opacity-100"
        >
          {pending ? "Checking…" : "Let's Contact Us"}
        </Button>
      </form>

      {checked ? (
        checked.available ? (
          <div className="mt-6 border border-gold/40 bg-sand/50 px-6 py-6">
            <h3 className="font-display text-2xl text-ink">Available on Your Date</h3>
            <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-graphite">
              This gown is currently available for your selected event date.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={contactHref}>Contact the Branch</ButtonLink>
              <ButtonLink href={requestCallHref} variant="secondary">
                Request a Call
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="mt-6 border border-line bg-offwhite px-6 py-6">
            <h3 className="font-display text-2xl text-ink">Not Available on This Date</h3>
            <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-stone">
              {checked.changed
                ? "This date is no longer available — it was taken while you were deciding. Please choose another date."
                : "This gown is already unavailable for your selected event date."}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setChecked(null);
                  setDate(null);
                }}
              >
                Choose Another Date
              </Button>
              <ButtonLink href={similarHref} variant="secondary">
                View Similar Dresses
              </ButtonLink>
            </div>
          </div>
        )
      ) : (
        <p className="mt-5 text-sm text-stone">
          Choose your event date to check availability.
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-mist">{GUIDANCE_NOTE}</p>
    </div>
  );
}
