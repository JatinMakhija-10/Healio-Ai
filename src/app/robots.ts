import type { MetadataRoute } from "next";

const siteUrl = "https://arovia-ai.vercel.app";

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
