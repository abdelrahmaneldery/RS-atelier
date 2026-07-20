import "server-only";

import { cache } from "react";

import { prisma } from "./prisma";

/**
 * Editorial and policy content.
 *
 * Business facts are never hardcoded in a component. Every value lives here and
 * carries an `isPlaceholder` flag; anything unset renders an honest
 * "not yet published" state rather than invented copy.
 *
 * Operational numbers (deposit percentage, buffer, horizon, window) are NOT
 * here — they are business rules owned by the backend and mirrored in
 * src/lib/domain/constants.ts.
 */

export const SETTING_KEYS = {
  contactPhone: "contact.phone",
  contactWhatsapp: "contact.whatsapp",
  contactEmail: "contact.email",
  contactOpeningHours: "contact.opening_hours",
  announcementText: "announcement.text",
  policyRental: "policy.rental",
  policyCancellation: "policy.cancellation",
  policyPrivacy: "policy.privacy",
  policyTerms: "policy.terms",
  policySizeGuide: "policy.size_guide",
  policyFaq: "policy.faq",
  storyBody: "content.our_story",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

/**
 * Fallbacks used when a key has never been configured. Anything that is a
 * *business fact* defaults to empty, so the site says "not yet published"
 * rather than inventing it.
 */
const FALLBACKS: Record<SettingKey, string> = {
  [SETTING_KEYS.contactPhone]: "",
  [SETTING_KEYS.contactWhatsapp]: "",
  [SETTING_KEYS.contactEmail]: "",
  [SETTING_KEYS.contactOpeningHours]: "[]",
  [SETTING_KEYS.announcementText]:
    "New Pieces Every Two Weeks — Reserve Yours Online",
  [SETTING_KEYS.policyRental]: "",
  [SETTING_KEYS.policyCancellation]: "",
  [SETTING_KEYS.policyPrivacy]: "",
  [SETTING_KEYS.policyTerms]: "",
  [SETTING_KEYS.policySizeGuide]: "",
  [SETTING_KEYS.policyFaq]: "[]",
  [SETTING_KEYS.storyBody]: "",
};

export type SettingValue = {
  key: SettingKey;
  value: string;
  /** True while the value is demo content awaiting confirmation. */
  isPlaceholder: boolean;
  /** True when nothing has been configured and the fallback is in use. */
  isUnset: boolean;
};

/** Deduplicated per request. */
export const loadSettings = cache(
  async (): Promise<Map<SettingKey, SettingValue>> => {
    const rows = await prisma.setting.findMany();
    const map = new Map<SettingKey, SettingValue>();
    for (const key of Object.values(SETTING_KEYS)) {
      const row = rows.find((r) => r.key === key);
      const value = row?.value ?? FALLBACKS[key];
      map.set(key, {
        key,
        value,
        isPlaceholder: row?.isPlaceholder ?? false,
        isUnset: !row || row.value.trim() === "",
      });
    }
    return map;
  },
);

export async function getSetting(key: SettingKey): Promise<SettingValue> {
  const settings = await loadSettings();
  return (
    settings.get(key) ?? {
      key,
      value: FALLBACKS[key],
      isPlaceholder: false,
      isUnset: true,
    }
  );
}

export type FaqEntry = { question: string; answer: string };

export function parseFaq(value: string): FaqEntry[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is FaqEntry =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as FaqEntry).question === "string" &&
        typeof (v as FaqEntry).answer === "string",
    );
  } catch {
    return [];
  }
}
