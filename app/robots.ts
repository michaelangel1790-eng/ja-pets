import type { MetadataRoute } from "next";

const SITE_URL = "https://ja-pets.co.il";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
