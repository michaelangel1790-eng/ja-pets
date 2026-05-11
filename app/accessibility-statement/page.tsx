import { PageWithChrome } from "@/components/page-with-chrome";
import { createPageMetadata } from "@/lib/seo";
import { AccessibilityStatementClient } from "./AccessibilityStatementClient";

export const metadata = createPageMetadata(
  "/accessibility-statement",
  "הצהרת נגישות",
  "הצהרת הנגישות של אתר ג'קוזי ומידע ליצירת קשר בנושא נגישות."
);

export default function AccessibilityStatementPage() {
  return (
    <PageWithChrome mainHeadingId="jacuzzi-page-h1">
      <AccessibilityStatementClient />
    </PageWithChrome>
  );
}
