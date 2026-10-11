import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aroviaai.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms", "/medical-disclaimer", "/cookie-policy", "/data-request"],
      disallow: ["/admin", "/dashboard", "/doctor", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
