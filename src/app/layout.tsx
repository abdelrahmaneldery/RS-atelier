import type { Metadata } from "next";
import { Playfair_Display, Manrope } from "next/font/google";

import "./globals.css";
import { SITE } from "@/config/site";
import { JsonLd, organisationJsonLd, siteUrl } from "@/lib/seo";

/**
 * Two families only (§7): an editorial serif (Playfair Display) for headings
 * and product names, a clean sans (Manrope) for navigation, buttons, prices,
 * filters and body. Both are self-hosted by next/font, so there is no external
 * request and no layout shift on load.
 */
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE.name} — Occasion Wear Rental`,
    template: `%s · ${SITE.shortName}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} — Occasion Wear Rental`,
    description: SITE.description,
    locale: "en_EG",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <JsonLd data={organisationJsonLd()} />
        {children}
      </body>
    </html>
  );
}
