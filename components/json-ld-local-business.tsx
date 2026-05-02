import { whatsappNumber, workHours } from "@/data/site-data";
import { mainLogoAbsoluteUrl } from "@/lib/site-images";
import { getSiteUrl } from "@/lib/site-url";

/** נתונים מובנים לחיפוש מקומי — עדכן כתובת רחוב כשיהיה מידע רשמי */
export function JsonLdLocalBusiness() {
  const base = getSiteUrl().origin;
  const payload = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "PetGroomer"],
    name: "JACUZZI — מספרת כלבים",
    description: `מספרת כלבים מקצועית באזור ירושלים — עד הבית או במשאית טיפוח. ${workHours.note}`,
    url: base,
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
    image: mainLogoAbsoluteUrl(base),
    sameAs: [`https://wa.me/${whatsappNumber}`],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
