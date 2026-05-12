import type { Metadata, Viewport } from "next";
import { ConsentAwarePlausible } from "@/components/consent-aware-plausible";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { CopyrightCorner } from "@/components/copyright-corner";
import { JsonLdLocalBusiness } from "@/components/json-ld-local-business";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  OG_SITE_NAME,
  SITE_TITLE_TEMPLATE_SUFFIX,
  pageCanonical,
} from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();
const homeUrl = pageCanonical("/");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_TITLE_TEMPLATE_SUFFIX}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: OG_SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: homeUrl,
    siteName: OG_SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_PATH,
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
};

/** רוחב מסך מכשיר, זום נגיש (לא נועלים maximum-scale=1), safe-area ל-iOS */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 0.95,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <JsonLdLocalBusiness />
        <ConsentAwarePlausible />
        <CookieConsentBanner />
        <a href="#main-content" className="skip-link">
          דלג לתוכן הראשי
        </a>
        {children}
        <CopyrightCorner />
      </body>
    </html>
  );
}
