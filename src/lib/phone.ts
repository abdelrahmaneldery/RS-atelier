/**
 * Phone normalization.
 *
 * Egypt (+20) is the default country. Normalized form is E.164 without the
 * leading '+', which is what is stored in Customer.normalizedPhone and used as
 * the login identity. The raw form the customer typed is kept separately.
 */

export const DEFAULT_COUNTRY_CODE = "20";

/** Egyptian mobile numbers: 1 followed by 0/1/2/5, then 8 digits. */
const EG_MOBILE = /^1[0125]\d{8}$/;

export type PhoneNormalizationResult =
  | { ok: true; normalized: string; display: string }
  | { ok: false; error: string };

export function normalizePhone(input: string): PhoneNormalizationResult {
  const raw = (input ?? "").trim();
  if (!raw) return { ok: false, error: "Enter your mobile number." };

  // Keep digits only; tolerate spaces, dashes, parentheses and a leading '+'.
  let digits = raw.replace(/[^\d+]/g, "");
  const hadPlus = digits.startsWith("+");
  digits = digits.replace(/\+/g, "");

  if (!digits) return { ok: false, error: "Enter your mobile number." };

  // International dialling prefix.
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (!hadPlus && digits.startsWith("0")) {
    // National format, e.g. 01001234567 -> 1001234567
    digits = DEFAULT_COUNTRY_CODE + digits.slice(1);
  } else if (!hadPlus && !digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    // Bare subscriber number, e.g. 1001234567
    digits = DEFAULT_COUNTRY_CODE + digits;
  }

  if (digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    const subscriber = digits.slice(DEFAULT_COUNTRY_CODE.length);
    if (!EG_MOBILE.test(subscriber)) {
      return {
        ok: false,
        error: "Enter a valid Egyptian mobile number, e.g. 010 1234 5678.",
      };
    }
    return {
      ok: true,
      normalized: DEFAULT_COUNTRY_CODE + subscriber,
      display: formatEgyptian(subscriber),
    };
  }

  // Other countries are accepted structurally but not validated per-country.
  if (digits.length < 8 || digits.length > 15) {
    return { ok: false, error: "Enter a valid mobile number." };
  }
  return { ok: true, normalized: digits, display: `+${digits}` };
}

function formatEgyptian(subscriber: string): string {
  // 1001234567 -> 010 1234 5678
  return `0${subscriber.slice(0, 2)} ${subscriber.slice(2, 6)} ${subscriber.slice(6)}`;
}

/**
 * Masks a stored number for display, e.g. 201001234567 -> 010 •••• 5678.
 * Used everywhere a phone number is shown outside of an authorised staff view.
 */
export function maskPhone(normalized: string | null | undefined): string {
  if (!normalized) return "—";
  const last4 = normalized.slice(-4);
  if (normalized.startsWith(DEFAULT_COUNTRY_CODE)) {
    const subscriber = normalized.slice(DEFAULT_COUNTRY_CODE.length);
    return `0${subscriber.slice(0, 2)} •••• ${last4}`;
  }
  return `••• ••• ${last4}`;
}

/** Full display form for authorised staff views. */
export function formatPhone(normalized: string | null | undefined): string {
  if (!normalized) return "—";
  if (normalized.startsWith(DEFAULT_COUNTRY_CODE)) {
    return formatEgyptian(normalized.slice(DEFAULT_COUNTRY_CODE.length));
  }
  return `+${normalized}`;
}

/** wa.me deep link. Returns null when there is no number to link to. */
export function whatsappLink(
  normalized: string | null | undefined,
  message?: string,
): string | null {
  if (!normalized) return null;
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telLink(normalized: string | null | undefined): string | null {
  return normalized ? `tel:+${normalized}` : null;
}
