import { LeadDetailsSection } from "@/components/lead-details-section";
import { PageWithChrome } from "@/components/page-with-chrome";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata(
  "/lead-details",
  "השארת פרטים",
  "השארת פרטים לתיאום טיפול כלבים בג'קוזי — מספרת כלבים בירושלים."
);

export default function LeadDetailsPage() {
  return (
    <PageWithChrome mainHeadingId="lead-heading">
      <LeadDetailsSection />
    </PageWithChrome>
  );
}
