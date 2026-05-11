import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo";

const ROUTES: {
  path: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/lead-details", changeFrequency: "monthly", priority: 0.85 },
  { path: "/accessibility-statement", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.5 },
  { path: "/terms-of-use", changeFrequency: "yearly", priority: 0.5 },
  { path: "/cancellation-policy", changeFrequency: "yearly", priority: 0.5 },
  { path: "/site-map", changeFrequency: "monthly", priority: 0.55 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_ORIGIN;
  const now = new Date();

  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
