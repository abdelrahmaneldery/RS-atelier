import type { Metadata } from "next";

import { SETTING_KEYS, getSetting } from "@/lib/settings";
import { PolicyPage } from "@/components/content/policy-page";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms that apply to the use of the RS Atelier website.",
};

export default async function TermsPage() {
  const setting = await getSetting(SETTING_KEYS.policyTerms);

  return (
    <PolicyPage
      title="Terms"
      eyebrow="Terms"
      intro="The terms that apply when using this website and requesting an atelier appointment."
      setting={setting}
    />
  );
}
