import Script from "next/script";

/** אנליטיקה פרטית — רק אם הוגדר דומיין בפריסה (Plausible). */
export function PlausibleAnalytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
  if (!domain) return null;

  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
