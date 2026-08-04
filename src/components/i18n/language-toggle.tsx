"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { cn } from "@/lib/cn";
import { setLocale } from "@/app/(site)/locale-actions";
import { useLocale, useT } from "./locale-provider";

/**
 * Language switch (العربية / EN). Persists the choice and re-renders the tree
 * in the new locale + direction.
 */
export function LanguageToggle({
  onDark = false,
  className,
}: {
  onDark?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const next = locale === "ar" ? "en" : "ar";
  // The button shows Arabic text ("العربية") while the site is in English.
  const showingArabic = locale !== "ar";
  const label = showingArabic ? "العربية" : "EN";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        })
      }
      aria-label={locale === "ar" ? t("common.switchToEnglish") : t("common.switchToArabic")}
      // Cairo for the Arabic label even in LTR, where the global RTL font rule doesn't reach.
      style={showingArabic ? { fontFamily: "var(--font-arabic), sans-serif" } : undefined}
      className={cn(
        "inline-flex min-h-11 items-center font-sans font-medium transition-colors duration-300 disabled:opacity-60",
        showingArabic ? "px-3 text-[0.9375rem]" : "px-2 text-[0.8125rem]",
        onDark ? "text-white/85 hover:text-white" : "text-graphite hover:text-ink",
        className,
      )}
    >
      {label}
    </button>
  );
}
