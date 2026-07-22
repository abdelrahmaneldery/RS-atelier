import "server-only";

import { cache } from "react";

import { api } from "./api/client";
import type { ApiBranch } from "./api/contract";

/**
 * The single RS Atelier store.
 *
 * The site is no longer branch-scoped: there is one store, and the whole
 * experience — catalogue, availability, contact and WhatsApp — runs against it.
 * It is resolved once per request from the backend; there is no selection, no
 * cookie and no gate.
 */
export const getStore = cache(async (): Promise<ApiBranch | null> => {
  const branches = await api.branches().catch(() => []);
  return branches[0] ?? null;
});
