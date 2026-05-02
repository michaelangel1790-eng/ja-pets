import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const paths = [
  "/",
  "/lead-details",
  "/accessibility-statement",
  "/privacy-policy",
  "/terms-of-use",
  "/cancellation-policy",
  "/site-map"
];

const viewports = [
  { label: "desktop", width: 1280, height: 720 },
  { label: "mobile", width: 390, height: 844 }
];

for (const vp of viewports) {
  for (const path of paths) {
    test(`axe WCAG 2.1 AA [${vp.label}] ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(path, { waitUntil: "load" });
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect.soft(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    });
  }
}
