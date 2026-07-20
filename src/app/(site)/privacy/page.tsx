import type { Metadata } from "next";

import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { PolicyPage } from "@/components/content/policy-page";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How RS Atelier handles the personal information shared when booking an appointment.",
};

export default async function PrivacyPage() {
  const setting = await getSetting(SETTING_KEYS.policyPrivacy);

  return (
    <PolicyPage
      title="Privacy"
      eyebrow="Privacy"
      intro="What the atelier records when you request an appointment, and what it is used for."
      setting={setting}
    />
  );
}
