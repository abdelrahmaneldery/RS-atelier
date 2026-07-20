import {
  BUFFER_WORKING_DAYS,
  HORIZON_DAYS,
  WEEKEND_DAYS,
  WINDOW_MAX_DAYS,
} from "./constants";

/**
 * Date arithmetic for the rental window (§4, §5).
 *
 * Everything here works in whole days at local midnight. A rental window is a
 * closed interval, and the cleaning buffer is counted in *working* days.
 */

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isWeekend(date: Date): boolean {
  return WEEKEND_DAYS.includes(date.getDay());
}

/** Advances by N working days, skipping the configured weekend. */
export function addWorkingDays(date: Date, workingDays: number): Date {
  let cursor = startOfDay(date);
  let remaining = workingDays;
  while (remaining > 0) {
    cursor = addDays(cursor, 1);
    if (!isWeekend(cursor)) remaining -= 1;
  }
  return cursor;
}

export function daysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** Date-only key in local time, e.g. "2026-07-20". */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a "YYYY-MM-DD" key as local midnight, avoiding UTC drift. */
export function fromDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() !== Number(m) - 1 ||
    date.getDate() !== Number(d)
  ) {
    return null; // e.g. 2026-02-31
  }
  return startOfDay(date);
}

export type RentalWindow = {
  eventDate: Date;
  handoverDate: Date;
  takebackDate: Date;
};

/**
 * The default window for an event date (§4):
 *   handover = event − 1 day (pickup)
 *   takeback = event + 1 day (return)
 */
export function deriveWindow(eventDate: Date): RentalWindow {
  const event = startOfDay(eventDate);
  return {
    eventDate: event,
    handoverDate: addDays(event, -1),
    takebackDate: addDays(event, 1),
  };
}

/**
 * The interval during which a dress is unavailable to anyone else:
 *   [handover, takeback + BUFFER working days]
 */
export function occupiedInterval(window: {
  handoverDate: Date;
  takebackDate: Date;
}): { start: Date; end: Date } {
  return {
    start: startOfDay(window.handoverDate),
    end: addWorkingDays(window.takebackDate, BUFFER_WORKING_DAYS),
  };
}

/** Closed-interval overlap. */
export function intervalsOverlap(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
): boolean {
  return a.start.getTime() <= b.end.getTime() && a.end.getTime() >= b.start.getTime();
}

/** Latest event date a customer may select. */
export function horizonDate(from: Date = new Date()): Date {
  return addDays(from, HORIZON_DAYS);
}

export type GuardFailure =
  | { code: "PAST_DATE"; message: string }
  | { code: "BEYOND_HORIZON"; message: string }
  | { code: "WINDOW_TOO_LONG"; message: string };

/**
 * Date guards 2 and 3 from §5. Product visibility, clash and branch match are
 * checked against the database by the caller.
 */
export function checkWindowGuards(window: RentalWindow): GuardFailure | null {
  const today = startOfDay(new Date());

  if (window.eventDate.getTime() < today.getTime()) {
    return { code: "PAST_DATE", message: "That event date has already passed." };
  }

  if (window.eventDate.getTime() > horizonDate(today).getTime()) {
    return {
      code: "BEYOND_HORIZON",
      message: `Bookings open up to ${HORIZON_DAYS} days ahead. Please choose an earlier date, or contact the branch.`,
    };
  }

  const span = daysBetween(window.handoverDate, window.takebackDate);
  if (span > WINDOW_MAX_DAYS) {
    return {
      code: "WINDOW_TOO_LONG",
      message: `A rental may not exceed ${WINDOW_MAX_DAYS} days.`,
    };
  }

  return null;
}
