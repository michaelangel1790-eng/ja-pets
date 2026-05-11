import Link from "next/link";
import { PageWithChrome } from "@/components/page-with-chrome";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata(
  "/site-map",
  "מפת אתר",
  "מפת דפי האתר לנוחות ניווט ונגישות — ג'קוזי מספרה לכלבים בירושלים."
);

const routes = [
  { href: "/", label: "דף הבית" },
  { href: "/?tab=services#tabs", label: "שירותים (דף הבית)" },
  { href: "/?tab=location#tabs", label: "מיקום המשאית (דף הבית)" },
  { href: "/lead-details", label: "השארת פרטים" },
  { href: "/accessibility-statement", label: "הצהרת נגישות" },
  { href: "/privacy-policy", label: "מדיניות פרטיות" },
  { href: "/terms-of-use", label: "תנאי שימוש" },
  { href: "/cancellation-policy", label: "מדיניות ביטולים" }
];

export default function SiteMapPage() {
  return (
    <PageWithChrome mainHeadingId="jacuzzi-page-h1">
      <section className="section-shell mx-auto max-w-3xl px-4 py-8 md:px-6">
        <h1 id="jacuzzi-page-h1" className="section-title">
          מפת אתר
        </h1>
        <p className="section-subtitle mt-2">
          רשימת דפים עיקריים באתר לניווט מהיר - בהתאם להנחיות נגישות לחשיפת מבנה האתר.
        </p>
        <ul className="mt-6 space-y-2 text-right">
          {routes.map((r) => (
            <li key={r.href + r.label}>
              <Link href={r.href} className="nav-link inline-block">
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageWithChrome>
  );
}
