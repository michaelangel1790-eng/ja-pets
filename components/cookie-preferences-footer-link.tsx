"use client";

import { EVENT_OPEN_SETTINGS } from "@/lib/cookie-consent";

export function CookiePreferencesFooterLink() {
  return (
    <button
      type="button"
      className="text-[12px] font-medium text-amber-200/90 underline decoration-amber-700/50 underline-offset-2 transition hover:text-amber-100 hover:decoration-amber-400/70"
      onClick={() => {
        window.dispatchEvent(new Event(EVENT_OPEN_SETTINGS));
      }}
    >
      ניהול העדפות עוגיות
    </button>
  );
}
