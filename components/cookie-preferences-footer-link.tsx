"use client";

import { EVENT_OPEN_SETTINGS } from "@/lib/cookie-consent";

export function CookiePreferencesFooterLink() {
  return (
    <button
      type="button"
      className="text-[12px] font-medium text-amber-100 underline decoration-amber-600/55 underline-offset-2 transition hover:text-white hover:decoration-amber-300/70"
      onClick={() => {
        window.dispatchEvent(new Event(EVENT_OPEN_SETTINGS));
      }}
    >
      ניהול העדפות עוגיות
    </button>
  );
}
