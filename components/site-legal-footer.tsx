import Link from "next/link";
import { CookiePreferencesFooterLink } from "@/components/cookie-preferences-footer-link";

const links = [
  { href: "/accessibility-statement", label: "הצהרת נגישות" },
  { href: "/privacy-policy", label: "מדיניות פרטיות" },
  { href: "/terms-of-use", label: "תנאי שימוש" },
  { href: "/cancellation-policy", label: "מדיניות ביטולים" },
  { href: "/site-map", label: "מפת אתר" },
  { href: "/lead-details", label: "השארת פרטים" }
];

export function SiteLegalFooter() {
  return (
    <footer
      role="contentinfo"
      aria-label="קישורים משפטיים ומהירים בתחתית האתר"
      className="border-t border-amber-900/40 bg-gradient-to-b from-black to-black/95 py-3.5 text-center text-[13px] md:py-4 md:text-sm"
    >
      <div className="mx-auto max-w-6xl px-4 lg:max-w-7xl xl:max-w-[88rem] lg:px-8">
        <p className="m-0 inline leading-relaxed">
          {links.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? (
                <span aria-hidden className="mx-2 text-amber-800/90">
                  ,
                </span>
              ) : null}
              <Link href={link.href} className="font-semibold">
                {link.label}
              </Link>
            </span>
          ))}
        </p>
        <p className="mt-2.5 mb-0">
          <CookiePreferencesFooterLink />
        </p>
      </div>
    </footer>
  );
}
