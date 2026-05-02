import { AccessibilityWidget } from "@/components/accessibility-widget";
import { SiteLegalFooter } from "@/components/site-legal-footer";
import { TopNav } from "@/components/top-nav";

type PageWithChromeProps = {
  children: React.ReactNode;
};

/**
 * Shared chrome for secondary routes: primary nav, legal footer strip, floating accessibility tools.
 */
export function PageWithChrome({ children }: PageWithChromeProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative pb-[max(2rem,env(safe-area-inset-bottom,0px))] text-white md:pb-10"
    >
      <TopNav />
      {children}
      <SiteLegalFooter />
      <AccessibilityWidget />
    </main>
  );
}
