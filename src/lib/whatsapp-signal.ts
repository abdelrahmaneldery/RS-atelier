/**
 * A tiny client-side signal for the current product name.
 *
 * The floating WhatsApp button lives in the site layout and has no knowledge of
 * the page it sits over. Product pages publish their dress name here on mount
 * (and clear it on unmount); the button reads it via `useSyncExternalStore`.
 * This is a plain store, not React state, so publishing from an effect is not a
 * `set-state-in-effect` violation.
 */

let dressName: string | null = null;
const listeners = new Set<() => void>();

export function setWhatsappDress(name: string | null): void {
  if (dressName === name) return;
  dressName = name;
  listeners.forEach((notify) => notify());
}

export function subscribeWhatsappDress(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function getWhatsappDress(): string | null {
  return dressName;
}

/** Server snapshot — nothing is published during SSR. */
export function getWhatsappDressServer(): null {
  return null;
}
