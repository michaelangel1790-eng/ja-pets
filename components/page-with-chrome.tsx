import { AccessibilityWidget } from "@/components/accessibility-widget";
import { SiteLegalFooter } from "@/components/site-legal-footer";
import { TopNav } from "@/components/top-nav";

type PageWithChromeProps = {
  children: React.ReactNode;
  /** מזהה של כותרת h1 בתוך התוכן — ל־aria-labelledby של main (נגישות) */
  mainHeadingId?: string;
};

/**
 * מעטפת לדפים משניים: באנר מחוץ ל־main, תוכן ב־main, פוטר כ־contentinfo — לפי מבנה ציוני דרך WCAG.
 */
export function PageWithChrome({ children, mainHeadingId }: PageWithChromeProps) {
  return (
    <>
      <TopNav />
      <main
        id="main-content"
        tabIndex={-1}
        {...(mainHeadingId
          ? { "aria-labelledby": mainHeadingId }
          : { "aria-label": "תוכן ראשי של העמוד" })}
        className="relative pb-[max(2rem,env(safe-area-inset-bottom,0px))] text-white md:pb-10"
      >
        {children}
      </main>
      <SiteLegalFooter />
      <AccessibilityWidget />
    </>
  );
}
