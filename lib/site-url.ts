/**
 * כתובת בסיס לאתר — ל־metadataBase, sitemap, robots ו־JSON-LD.
 * הגדר בפריסה: NEXT_PUBLIC_SITE_URL=https://www.example.com
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
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    try {
      return new URL(host);
    } catch {
      /* fall through */
    }
  }
  return new URL("http://localhost:3000");
}
