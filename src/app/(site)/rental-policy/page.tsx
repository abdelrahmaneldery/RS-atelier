import type { Metadata } from "next";

import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { PolicyPage } from "@/components/content/policy-page";

export const metadata: Metadata = {
  title: "Rental Policy",
  description:
    "The terms under which RS Atelier rents its occasion wear, as published by the atelier.",
};

export default async function RentalPolicyPage() {
  const setting = await getSetting(SETTING_KEYS.policyRental);

  return (
    <PolicyPage
      title="Rental Policy"
      eyebrow="Rental Policy"
      intro="How the rental works, from the moment a dress is reserved for you to the moment it comes home."
      setting={setting}
    />
  );
}
