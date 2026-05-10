import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV !== "production";
/** Plausible (אנליטיקה) + Sentry — רק אם הוגדרו במשתני סביבה */
const cspValue = isDev
  ? "default-src 'self'; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io; connect-src 'self' https://wa.me https://docs.google.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://plausible.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  : "default-src 'self'; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://plausible.io; connect-src 'self' https://wa.me https://docs.google.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://plausible.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "localhost", "192.168.1.156"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**"
      }
    ]
  },
  async headers() {
    const globalSecurity = [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: cspValue,
          },
        ],
      },
    ];

    /** בפיתוח: בלי Cache-Control מותאם ל־/_next ולתמונות — כך Next לא מזהיר ופחות קריסות אחרי שינוי config */
    if (isDev) {
      return globalSecurity;
    }

    return [
      {
        source: "/images/jacuzzi-truck-promo-nobg.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120, s-maxage=120, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/images/jacuzzi-truck-promo-flat.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=120, s-maxage=120, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      /**
       * לא מגדירים Cache-Control ל־/_next/static — Vercel מזהיר על זה וכבר מטפל בקבצים עם hash.
       */
      {
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      ...globalSecurity,
    ];
  },
  async redirects() {
    return [
      { source: "/terms", destination: "/terms-of-use", permanent: true },
      { source: "/terms/", destination: "/terms-of-use", permanent: true }
    ];
  },
  async rewrites() {
    return [
      { source: "/הצהרת-נגישות", destination: "/accessibility-statement" },
      { source: "/מדיניות-פרטיות", destination: "/privacy-policy" },
      { source: "/תנאי-שימוש", destination: "/terms-of-use" },
      { source: "/מדיניות-ביטולים", destination: "/cancellation-policy" }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
