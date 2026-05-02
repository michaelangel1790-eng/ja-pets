import type { Metadata } from "next";
import { LeadDetailsSection } from "@/components/lead-details-section";
import { PageWithChrome } from "@/components/page-with-chrome";

export const metadata: Metadata = {
  title: "השארת פרטים | JACUZZI",
  description: "השארת פרטים לתיאום שירות טיפוח כלבים ב-JACUZZI."
};

export default function LeadDetailsPage() {
  return (
    <PageWithChrome>
      <LeadDetailsSection />
    </PageWithChrome>
  );
}
