"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  EVENT_CONSENT_UPDATED,
  shouldLoadAnalytics
} from "@/lib/cookie-consent";

/** Plausible נטען רק לאחר הסכמה לאנליטיקה — לא לפני. */
export function ConsentAwarePlausible() {
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    const sync = () => setAllow(shouldLoadAnalytics());
    sync();
    window.addEventListener(EVENT_CONSENT_UPDATED, sync);
    return () => window.removeEventListener(EVENT_CONSENT_UPDATED, sync);
  }, []);

  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
  if (!domain || !allow) return null;

  return (
    <Script defer data-domain={domain} src="https://plausible.io/js/script.js" strategy="afterInteractive" />
  );
}
