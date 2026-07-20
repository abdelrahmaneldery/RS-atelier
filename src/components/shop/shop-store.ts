"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Client-only "Recently Viewed" store.
 *
 * There is no backend and no account (§ the site is anonymous). The list lives
 * entirely in localStorage, keyed by slug, and is read through
 * `useSyncExternalStore` so that:
 *
 *   - SSR and the first client paint render the empty state (no hydration
 *     mismatch, no flash of viewed items), and
 *   - a change in one component (or another browser tab) updates every other
 *     component reading the same list.
 *
 * We deliberately do NOT read localStorage in a useEffect + setState — that
 * trips this project's `react-hooks/set-state-in-effect` lint rule. The store
 * snapshot is the raw localStorage string, and each hook parses it with
 * `useMemo`, so the value React compares is a stable string.
 */

const RECENT_KEY = "rs.recent.v1";

/** Most-recent-first, capped so the list never grows without bound. */
const RECENT_CAP = 12;

type Listener = () => void;

/** Every mounted hook subscribes here so a write notifies all of them. */
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

/**
 * Shared subscription. In addition to same-tab writes (via `emit`), we listen
 * for the `storage` event so changes made in another tab are reflected here.
 */
function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === RECENT_KEY || event.key === null) {
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Raw read. Wrapped in try/catch for Safari private mode et al. */
function readRaw(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

/** Raw write, then notify. Failures (quota, private mode) are swallowed. */
function writeRaw(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // No persistence available — the in-memory UI still updates via emit().
  }
  emit();
}

function parseSlugs(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

// --- Snapshots --------------------------------------------------------------

const getRecentSnapshot = () => readRaw(RECENT_KEY);
/** SSR + first paint: empty, so nothing renders until the client rehydrates. */
const getServerSnapshot = () => "";

// --- Mutations (module-level; no provider needed) ---------------------------

/**
 * Record a dress view. Dedupes, moves the slug to the front (most recent), and
 * caps the list at {@link RECENT_CAP}. Safe to call on every mount.
 */
export function recordRecentlyViewed(slug: string): void {
  if (!slug) return;
  const current = parseSlugs(readRaw(RECENT_KEY));
  const next = [slug, ...current.filter((s) => s !== slug)].slice(0, RECENT_CAP);
  // Skip the write (and the notify) when nothing actually changed.
  if (next.length === current.length && next.every((s, i) => s === current[i])) {
    return;
  }
  writeRaw(RECENT_KEY, JSON.stringify(next));
}

// --- Hooks ------------------------------------------------------------------

export function useRecentlyViewed(): { slugs: string[] } {
  const raw = useSyncExternalStore(subscribe, getRecentSnapshot, getServerSnapshot);
  const slugs = useMemo(() => parseSlugs(raw), [raw]);
  return { slugs };
}
