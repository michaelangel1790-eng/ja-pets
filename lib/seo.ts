import type { Metadata } from "next";

/** דומיין ראשי קנוני — canonical, sitemap, robots, JSON-LD ציבורי */
export const SITE_ORIGIN = "https://ja-pets.co.il";

export const DEFAULT_TITLE =
  "ג'קוזי מספרה לכלבים | תספורות וטיפוח כלבים בירושלים";

export const DEFAULT_DESCRIPTION =
  "ג'קוזי מספרה לכלבים בירושלים ✂️🐶 שירות מקצועי עד הבית עם תספורות, דילול פרווה, רחצה וטיפוח אישי לכל סוגי הכלבים. צוות מקצועי עם ניסיון של שנים.";

export const OG_SITE_NAME = "ג'קוזי | JACUZZI";

/** תמונת OG ברירת מחדל — החלף את הקובץ ב־public/og-image.jpg לעיצוב מלא */
export const OG_IMAGE_PATH = "/og-image.jpg";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const SITE_TITLE_TEMPLATE_SUFFIX = "ג'קוזי מספרה לכלבים";

export function pageCanonical(pathname: string): string {
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (p === "/") return SITE_ORIGIN;
  return `${SITE_ORIGIN}${p}`;
}

export function fullPageTitle(shortTitle: string): string {
  return `${shortTitle} | ${SITE_TITLE_TEMPLATE_SUFFIX}`;
}

const defaultOgImage = {
  url: OG_IMAGE_PATH,
  width: OG_IMAGE_WIDTH,
  height: OG_IMAGE_HEIGHT,
  alt: "ג'קוזי — מספרת כלבים בירושלים",
} as const;

export function createPageMetadata(
  path: string,
  shortTitle: string,
  description: string
): Metadata {
  const canonical = pageCanonical(path);
  const ogTitle = fullPageTitle(shortTitle);
  return {
    title: shortTitle,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "he_IL",
      url: canonical,
      siteName: OG_SITE_NAME,
      title: ogTitle,
      description,
      images: [defaultOgImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [OG_IMAGE_PATH],
    },
  };
}
