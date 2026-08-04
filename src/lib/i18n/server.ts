import "server-only";

import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { translate, type Translator } from "./messages";

/** The active locale for this request, read from the cookie. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** A translator bound to the request's locale, for use in server components. */
export async function getT(): Promise<Translator> {
  const locale = await getLocale();
  return (path, vars) => translate(locale, path, vars);
}
