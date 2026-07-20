/**
 * Money is stored in piastres (EGP minor units) and only ever formatted here.
 * Never store or compute money as a float.
 */

export function toMinorUnits(major: number): number {
  return Math.round(major * 100);
}

export function toMajorUnits(minor: number): number {
  return minor / 100;
}

export function formatMoney(minor: number, currency = "EGP"): string {
  const value = toMajorUnits(minor);
  const formatted = new Intl.NumberFormat("en-EG", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${formatted} ${currency}`;
}

// --- Dates ----------------------------------------------------------------

const DATE_LOCALE = "en-GB";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

/** "14:30" -> "2:30 PM" */
export function formatTimeSlot(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const hours = Number(hStr);
  const minutes = mStr ?? "00";
  if (Number.isNaN(hours)) return hhmm;
  const period = hours >= 12 ? "PM" : "AM";
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${minutes} ${period}`;
}

/** Date-only ISO key ("2026-07-19") in local time, used for slot lookups. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

// --- JSON list columns ----------------------------------------------------

/** SQLite has no array type; list-shaped columns hold a JSON array of strings. */
export function parseStringList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

export function serializeStringList(values: string[]): string {
  return JSON.stringify(values);
}

export type OpeningHour = { label: string; value: string };

export function parseOpeningHours(value: string | null | undefined): OpeningHour[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is OpeningHour =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as OpeningHour).label === "string" &&
        typeof (v as OpeningHour).value === "string",
    );
  } catch {
    return [];
  }
}
