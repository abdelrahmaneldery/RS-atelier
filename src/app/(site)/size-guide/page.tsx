import type { Metadata } from "next";

import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { PolicyPage } from "@/components/content/policy-page";

export const metadata: Metadata = {
  title: "Size Guide",
  description:
    "Sizing guidance for RS Atelier occasion wear, as published by the atelier.",
};

export default async function SizeGuidePage() {
  const setting = await getSetting(SETTING_KEYS.policySizeGuide);

  return (
    <PolicyPage
      title="Size Guide"
      eyebrow="Fit & Sizing"
      intro="Sizing runs differently from one designer to the next. Every dress is tried on in the atelier, and the team fits each piece to you in person."
      setting={setting}
    />
  );
}
