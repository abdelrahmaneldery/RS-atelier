import type { Metadata } from "next";

import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { PolicyPage } from "@/components/content/policy-page";

export const metadata: Metadata = {
  title: "Cancellation Policy",
  description:
    "How appointment and rental cancellations are handled at RS Atelier.",
};

export default async function CancellationPolicyPage() {
  const setting = await getSetting(SETTING_KEYS.policyCancellation);

  return (
    <PolicyPage
      title="Cancellation Policy"
      eyebrow="Cancellation"
      intro="Plans change. This page explains how the atelier handles changes to appointments and rentals."
      setting={setting}
    />
  );
}
