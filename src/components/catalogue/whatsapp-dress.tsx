"use client";

import { useEffect } from "react";

import { setWhatsappDress } from "@/lib/whatsapp-signal";

/**
 * Publishes the current dress name to the floating WhatsApp button while a
 * product page is mounted, and clears it on the way out. Renders nothing.
 */
export function WhatsappDress({ name }: { name: string }) {
  useEffect(() => {
    setWhatsappDress(name);
    return () => setWhatsappDress(null);
  }, [name]);

  return null;
}
