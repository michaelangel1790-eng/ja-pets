import { AccessibilityWidget } from "@/components/accessibility-widget";
import { HeroSection } from "@/components/HeroSection";
import { InfoTabs } from "@/components/info-tabs";
import { SiteLegalFooter } from "@/components/site-legal-footer";
import { TopNav } from "@/components/top-nav";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function HomePage() {
  return (
    <>
      <TopNav />
      <main
        id="main-content"
        tabIndex={-1}
        aria-labelledby="jacuzzi-main-page-title"
        className="relative pb-[max(2rem,env(safe-area-inset-bottom,0px))] md:pb-10"
      >
        <div className="relative z-10">
          <h1
            id="jacuzzi-main-page-title"
            className="visually-hidden"
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              padding: 0,
              margin: "-1px",
              overflow: "hidden",
              clipPath: "inset(50%)",
              whiteSpace: "nowrap",
              border: 0
            }}
          >
            JACUZZI - מספרת כלבים ניידת ומשאית טיפוח בירושלים
          </h1>
          <HeroSection />
          <InfoTabs />
        </div>
      </main>
      <SiteLegalFooter />
      <AccessibilityWidget />
      <WhatsAppButton />
    </>
  );
}
