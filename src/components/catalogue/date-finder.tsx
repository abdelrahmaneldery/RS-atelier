"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { HORIZON_DAYS } from "@/lib/domain/constants";
import { addDays, toDateKey } from "@/lib/domain/dates";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

/**
 * Date → free dresses (§5 mode 2).
 *
 * Sends the customer to the availability view for one event date. The horizon
 * is enforced here for UX and again on the server, which is authoritative.
 */
export function DateFinder({
  branchId,
  branchSlug,
}: {
  branchId: string;
  branchSlug: string;
}) {
  const router = useRouter();
  const [eventDate, setEventDate] = useState("");

  const today = new Date();
  const min = toDateKey(today);
  const max = toDateKey(addDays(today, HORIZON_DAYS));

  const ready = eventDate !== "";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready) return;
        router.push(
          `/branches/${branchSlug}/available?date=${encodeURIComponent(eventDate)}`,
        );
      }}
      className="flex flex-col gap-4 sm:flex-row sm:items-end"
    >
      <input type="hidden" value={branchId} readOnly />
      <div className="sm:w-60">
        <Field label="Your Event Date" htmlFor="event-date" required>
          <Input
            id="event-date"
            name="date"
            type="date"
            min={min}
            max={max}
            value={eventDate}
            onChange={(e) => setEventDate(e.currentTarget.value)}
            required
          />
        </Field>
      </div>
      {/* Outlined until a date is picked. A filled button greyed out reads as
          broken rather than as "not yet". */}
      <Button
        type="submit"
        size="lg"
        variant={ready ? "primary" : "secondary"}
        disabled={!ready}
        className="disabled:opacity-100"
      >
        Show Available Gowns
      </Button>
    </form>
  );
}
