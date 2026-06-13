import type { MetadataRoute } from "next";

const siteUrl = "https://healio-ai.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/start", "/privacy", "/terms", "/medical-disclaimer", "/cookie-policy", "/data-request"],
      disallow: ["/admin", "/dashboard", "/doctor", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
