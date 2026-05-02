import type { Metadata } from "next";
import { PageWithChrome } from "@/components/page-with-chrome";
import { AccessibilityStatementClient } from "./AccessibilityStatementClient";

export const metadata: Metadata = {
  title: "הצהרת נגישות | JACUZZI",
  description: "הצהרת הנגישות של אתר JACUZZI ומידע ליצירת קשר בנושא נגישות."
};

export default function AccessibilityStatementPage() {
  return (
    <PageWithChrome>
      <AccessibilityStatementClient />
    </PageWithChrome>
  );
}
