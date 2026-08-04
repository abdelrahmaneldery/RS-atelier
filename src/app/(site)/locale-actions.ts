"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";

const YEAR = 60 * 60 * 24 * 365;

/** Persist the chosen language and re-render the whole tree in it. */
export async function setLocale(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    // Not secure — a public UI preference, and a secure cookie is dropped over
    // http (which would silently reset the language on refresh).
    secure: false,
    path: "/",
    maxAge: YEAR,
  });
  revalidatePath("/", "layout");
}
