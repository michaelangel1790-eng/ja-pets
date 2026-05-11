import { whatsappNumber, workHours } from "@/data/site-data";
import { mainLogoAbsoluteUrl } from "@/lib/site-images";
import { SITE_ORIGIN } from "@/lib/seo";

/** נתונים מובנים לחיפוש מקומי — עדכן כתובת רחוב כשיהיה מידע רשמי */
export function JsonLdLocalBusiness() {
  const payload = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "PetGroomer"],
    name: "ג'קוזי — מספרת כלבים בירושלים",
    description: `ג'קוזי מספרה לכלבים בירושלים — תספורות, טיפוח ורחצה עד הבית או במשאית הטיפוח. ${workHours.note}`,
    url: SITE_ORIGIN,
    telephone: "+972-50-550-1662",
    priceRange: "$$",
    areaServed: {
      "@type": "City",
      name: "ירושלים",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "ירושלים",
      addressCountry: "IL",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
      opens: "08:00",
      closes: "20:00",
    },
    image: mainLogoAbsoluteUrl(SITE_ORIGIN),
    sameAs: [`https://wa.me/${whatsappNumber}`],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
