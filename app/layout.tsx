import type { Metadata, Viewport } from "next";
import { CopyrightCorner } from "@/components/copyright-corner";
import { JsonLdLocalBusiness } from "@/components/json-ld-local-business";
import { PlausibleAnalytics } from "@/components/plausible-analytics";
import { mainLogoHeight, mainLogoSrc, mainLogoWidth } from "@/lib/site-images";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "JACUZZI | מספרת כלבים בירושלים",
    template: "%s | JACUZZI",
  },
  description: "מספרת כלבים מקצועית באזור ירושלים - עד הבית או במשאית טיפוח.",
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: siteUrl,
    siteName: "JACUZZI",
    title: "JACUZZI | מספרת כלבים בירושלים",
    description: "מספרת כלבים מקצועית באזור ירושלים - עד הבית או במשאית טיפוח.",
    images: [
      {
        url: mainLogoSrc,
        width: mainLogoWidth,
        height: mainLogoHeight,
        alt: "לוגו JACUZZI — SPA FOR PET",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JACUZZI | מספרת כלבים בירושלים",
    description: "מספרת כלבים מקצועית באזור ירושלים - עד הבית או במשאית טיפוח.",
    images: [mainLogoSrc],
  },
};

/** רוחב מסך מכשיר, זום נגיש (לא נועלים maximum-scale=1), safe-area ל-iOS */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 0.95,
  maximumScale: 5,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <JsonLdLocalBusiness />
        <PlausibleAnalytics />
        <a href="#main-content" className="skip-link">
          דלג לתוכן הראשי
        </a>
        {children}
        <CopyrightCorner />
      </body>
    </html>
  );
}
