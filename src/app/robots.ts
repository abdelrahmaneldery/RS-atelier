import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private to an individual customer, and of no search value.
      disallow: ["/book/confirmed/", "/booking-lookup"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
