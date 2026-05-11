import { SITE_ORIGIN } from "@/lib/seo";

/**
 * כתובת בסיס לאתר — metadataBase, OG יחסי, JSON-LD.
 * אופציונלי: NEXT_PUBLIC_SITE_URL לסביבה מותאמת.
 * בפרודקשן ללא env — תמיד הדומיין הראשי (לא VERCEL_URL).
 */

export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit.endsWith("/") ? explicit.slice(0, -1) : explicit);
    } catch {
      /* fall through */
    }
  }
  if (process.env.NODE_ENV === "development") {
    return new URL("http://localhost:3000");
  }
  try {
    return new URL(SITE_ORIGIN);
  } catch {
    return new URL("http://localhost:3000");
  }
}
