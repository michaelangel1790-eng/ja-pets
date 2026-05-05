"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  clearAllConsentStorageKeys,
  COOKIE_LS_ANALYTICS,
  COOKIE_LS_CONSENT,
  COOKIE_LS_MARKETING,
  dispatchConsentUpdated,
  EVENT_OPEN_SETTINGS,
  getConsentFromStorage,
  type StoredConsent
} from "@/lib/cookie-consent";

const BANNER_TEXT =
  "האתר משתמש בקובצי Cookies ובכלי מדידה ופרסום לצורך תפעול תקין, שיפור חוויית המשתמש, ניתוח שימוש באתר והתאמת תוכן ופרסום. ניתן לאשר את כלל העוגיות, לבחור עוגיות חיוניות בלבד או לנהל העדפות. מידע נוסף זמין במדיניות הפרטיות.";

const SETTINGS_INTRO =
  "כאן ניתן לבחור אילו סוגי עוגיות לאפשר באתר. עוגיות חיוניות נדרשות להפעלה תקינה של האתר ואינן ניתנות לכיבוי. עוגיות אנליטיקה ופרסום יסייעו לנו לשפר את השירות ולהתאים תוכן ופרסום.";

const CAT_ESSENTIAL =
  "עוגיות הנדרשות להפעלה תקינה של האתר, שמירת העדפות בסיסיות ואבטחה.";
const CAT_ANALYTICS =
  "עוגיות המסייעות לנו להבין כיצד משתמשים באתר, אילו עמודים נצפים וכיצד ניתן לשפר את חוויית המשתמש.";
const CAT_MARKETING =
  "עוגיות וכלי מדידה שעשויים לשמש להתאמת פרסומות, מדידת קמפיינים ושיווק בפלטפורמות כגון Facebook, Instagram, TikTok ו-Google.";

function CookieIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.35" />
      <circle cx="7.5" cy="8" r="1.15" fill="currentColor" />
      <circle cx="12.5" cy="7.25" r="1" fill="currentColor" />
      <circle cx="11.75" cy="12.25" r="0.9" fill="currentColor" />
      <circle cx="15.5" cy="11.5" r="0.85" fill="currentColor" />
    </svg>
  );
}

/** מתג שעובד נכון ב-RTL/LTR — הגלילה זזה לצד הנכון בלי translate ידני */
function ConsentSwitch({
  pressed,
  onToggle,
  id,
  labelledBy,
  describedBy
}: {
  pressed: boolean;
  onToggle: () => void;
  id: string;
  labelledBy: string;
  describedBy?: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={pressed}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={onToggle}
      className={[
        "relative flex h-8 w-[3.25rem] shrink-0 items-center rounded-full p-1 transition-[background-color,box-shadow] duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fde68a]/90",
        pressed
          ? "justify-end bg-gradient-to-b from-[#e8cf82] to-[#b8941f] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
          : "justify-start bg-white/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] hover:bg-white/20"
      ].join(" ")}
    >
      <span className="pointer-events-none h-6 w-6 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.35)] ring-1 ring-black/10" />
    </button>
  );
}

function persist(
  mode: StoredConsent,
  analytics: boolean,
  marketing: boolean
): void {
  try {
    localStorage.setItem(COOKIE_LS_CONSENT, mode);
    localStorage.setItem(COOKIE_LS_ANALYTICS, analytics ? "true" : "false");
    localStorage.setItem(COOKIE_LS_MARKETING, marketing ? "true" : "false");
    dispatchConsentUpdated();
  } catch {
    /* localStorage מלא / חסום — לא מפילים את העמוד */
  }
}

export function CookieConsentBanner() {
  const titleId = useId();
  const settingsTitleId = useId();
  const catAnalyticsLabelId = useId();
  const catMarketingLabelId = useId();
  const analyticsSwitchId = useId();
  const marketingSwitchId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [analyticsOn, setAnalyticsOn] = useState(false);
  const [marketingOn, setMarketingOn] = useState(false);

  const syncFromStorage = useCallback(() => {
    const { consent, analytics, marketing } = getConsentFromStorage();
    setAnalyticsOn(analytics);
    setMarketingOn(marketing);
    setShowBanner(consent === null);
  }, []);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("resetCookieConsent") === "1") {
        clearAllConsentStorageKeys();
        params.delete("resetCookieConsent");
        const query = params.toString();
        const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
        window.history.replaceState(null, "", next);
        dispatchConsentUpdated();
      }
    }
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    const onOpen = () => {
      const { analytics, marketing } = getConsentFromStorage();
      setAnalyticsOn(analytics);
      setMarketingOn(marketing);
      previouslyFocused.current = document.activeElement as HTMLElement;
      setShowSettings(true);
    };
    window.addEventListener(EVENT_OPEN_SETTINGS, onOpen);
    return () => window.removeEventListener(EVENT_OPEN_SETTINGS, onOpen);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (showBanner && !showSettings) {
      document.body.style.paddingBottom = "max(9rem, env(safe-area-inset-bottom))";
    } else if (!showSettings) {
      document.body.style.paddingBottom = "";
    }
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [mounted, showBanner, showSettings]);

  useEffect(() => {
    if (!showSettings) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSettings(false);
        previouslyFocused.current?.focus?.();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showSettings]);

  useEffect(() => {
    if (showSettings && dialogRef.current) {
      const focusable = dialogRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [showSettings]);

  const closeSettings = () => {
    setShowSettings(false);
    previouslyFocused.current?.focus?.();
    syncFromStorage();
  };

  const acceptAll = () => {
    persist("accepted_all", true, true);
    setAnalyticsOn(true);
    setMarketingOn(true);
    setShowBanner(false);
    setShowSettings(false);
  };

  const essentialOnly = () => {
    persist("essential_only", false, false);
    setAnalyticsOn(false);
    setMarketingOn(false);
    setShowBanner(false);
    setShowSettings(false);
  };

  const openSettingsFromBanner = () => {
    const { analytics, marketing } = getConsentFromStorage();
    setAnalyticsOn(analytics);
    setMarketingOn(marketing);
    setShowSettings(true);
  };

  const saveCustom = () => {
    persist("custom", analyticsOn, marketingOn);
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!mounted) return null;

  return (
    <>
      {showBanner ? (
        <div
          role="region"
          aria-label="הסכמה לשימוש בעוגיות"
          className="fixed inset-x-0 bottom-0 z-[10050] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:px-6 md:pb-5"
        >
          <div className="mx-auto max-w-4xl overflow-hidden rounded-[1.35rem] border border-[#d4af37]/25 bg-[#0a101c]/92 shadow-[0_-12px_48px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-xl md:rounded-3xl">
            <div className="h-1 bg-gradient-to-l from-[#8b6914] via-[#e8cf82] to-[#c9a227]" aria-hidden />
            <div className="px-4 py-4 md:px-7 md:py-6">
              <div className="mb-3 flex items-start gap-3 md:items-center">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#d4af37]/12 text-[#e8cf82] ring-1 ring-[#d4af37]/25 md:h-11 md:w-11">
                  <CookieIcon className="opacity-95" />
                </span>
                <p className="m-0 flex-1 text-sm leading-[1.65] text-[var(--jacuzzi-body-muted,#dbe8f5)] md:text-[0.95rem] md:leading-relaxed">
                  {BANNER_TEXT}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2.5 md:mt-6 md:flex-row md:flex-wrap md:items-stretch md:justify-end md:gap-3">
                <button
                  type="button"
                  className="order-1 w-full rounded-xl bg-gradient-to-b from-[#f0dc8f] via-[#e8cf82] to-[#b8941f] px-4 py-3 text-sm font-extrabold tracking-tight text-[#0a0f18] shadow-[0_4px_20px_rgba(212,175,55,0.35),inset_0_1px_0_rgba(255,255,255,0.45)] transition hover:brightness-[1.06] active:brightness-95 md:order-none md:w-auto md:min-w-[148px] md:py-2.5"
                  onClick={acceptAll}
                >
                  מאשר/ת הכל
                </button>
                <button
                  type="button"
                  className="order-2 w-full rounded-xl border border-[#d4af37]/45 bg-white/[0.04] px-4 py-3 text-sm font-bold text-[var(--jacuzzi-cream,#f8f2d9)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-[#d4af37]/65 hover:bg-white/[0.07] md:order-none md:w-auto md:min-w-[168px] md:py-2.5"
                  onClick={essentialOnly}
                >
                  רק עוגיות חיוניות
                </button>
                <button
                  type="button"
                  className="order-3 w-full rounded-xl border border-white/18 bg-transparent px-4 py-3 text-sm font-semibold text-neutral-100/95 transition hover:border-white/28 hover:bg-white/[0.06] md:order-none md:w-auto md:px-5 md:py-2.5"
                  onClick={openSettingsFromBanner}
                >
                  הגדרות
                </button>
                <Link
                  href="/privacy-policy"
                  className="order-4 flex min-h-[44px] w-full items-center justify-center rounded-xl py-2.5 text-center text-sm font-semibold text-[var(--jacuzzi-gold,#e6c16a)] underline decoration-[#d4af37]/45 underline-offset-[5px] transition hover:text-[#fde68a] hover:decoration-[#e8cf82]/70 md:order-none md:inline-flex md:w-auto md:justify-end md:px-4 md:py-2.5"
                >
                  מדיניות פרטיות
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showSettings ? (
        <div
          className="fixed inset-0 z-[10060] flex items-end justify-center bg-[#050810]/72 p-0 backdrop-blur-[3px] sm:items-center sm:p-4 md:p-6"
          aria-hidden={false}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeSettings();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={settingsTitleId}
            className="max-h-[min(92vh,760px)] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] border border-[#d4af37]/22 border-b-0 bg-gradient-to-b from-[#141c2e]/98 to-[#0a0f18]/99 shadow-[0_-24px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.05)_inset] sm:rounded-3xl sm:border sm:border-b md:max-h-[min(88vh,760px)]"
          >
            <div className="h-1 bg-gradient-to-l from-[#7a5c10] via-[#e8cf82] to-[#c9a227] sm:rounded-t-3xl" aria-hidden />
            <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-right sm:p-6 sm:pb-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d4af37]/14 text-[#f4e4a8] ring-1 ring-[#d4af37]/28">
                  <CookieIcon className="h-[22px] w-[22px]" />
                </span>
                <h2 id={settingsTitleId} className="m-0 text-lg font-bold tracking-tight text-[#fde68a] md:text-xl">
                  הגדרות עוגיות
                </h2>
              </div>
              <p className="mt-4 text-sm leading-[1.65] text-neutral-200/95">{SETTINGS_INTRO}</p>

              <ul className="mt-6 space-y-3 text-sm">
                <li className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] to-transparent p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-[var(--jacuzzi-gold,#e6c16a)]">חיוניות</span>
                    <span className="shrink-0 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/12 px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#fde68a]">
                      תמיד פעיל
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-neutral-400">{CAT_ESSENTIAL}</p>
                </li>

                <li className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] to-transparent p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="flex items-center justify-between gap-3">
                    <span id={catAnalyticsLabelId} className="font-semibold text-[var(--jacuzzi-gold,#e6c16a)]">
                      אנליטיקה
                    </span>
                    <ConsentSwitch
                      id={analyticsSwitchId}
                      labelledBy={catAnalyticsLabelId}
                      describedBy={`${titleId}-analytics`}
                      pressed={analyticsOn}
                      onToggle={() => setAnalyticsOn((v) => !v)}
                    />
                  </div>
                  <p id={`${titleId}-analytics`} className="mt-2.5 text-xs leading-relaxed text-neutral-400">
                    {CAT_ANALYTICS}
                  </p>
                </li>

                <li className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.07] to-transparent p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  <div className="flex items-center justify-between gap-3">
                    <span id={catMarketingLabelId} className="font-semibold text-[var(--jacuzzi-gold,#e6c16a)]">
                      פרסום ושיווק
                    </span>
                    <ConsentSwitch
                      id={marketingSwitchId}
                      labelledBy={catMarketingLabelId}
                      describedBy={`${titleId}-marketing`}
                      pressed={marketingOn}
                      onToggle={() => setMarketingOn((v) => !v)}
                    />
                  </div>
                  <p id={`${titleId}-marketing`} className="mt-2.5 text-xs leading-relaxed text-neutral-400">
                    {CAT_MARKETING}
                  </p>
                </li>
              </ul>

              <div className="mt-8 flex flex-col gap-2.5 border-t border-white/10 pt-6 sm:flex-row sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  className="w-full rounded-xl bg-gradient-to-b from-[#f0dc8f] via-[#e8cf82] to-[#b8941f] px-5 py-3 text-sm font-extrabold text-[#0a0f18] shadow-[0_4px_18px_rgba(212,175,55,0.3),inset_0_1px_0_rgba(255,255,255,0.45)] transition hover:brightness-[1.05] active:brightness-95 sm:order-2 sm:w-auto sm:min-w-[148px] sm:py-2.5"
                  onClick={saveCustom}
                >
                  שמור העדפות
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl border border-white/22 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-neutral-100 transition hover:border-white/35 hover:bg-white/[0.07] sm:order-1 sm:w-auto sm:py-2.5"
                  onClick={closeSettings}
                >
                  סגור
                </button>
                <Link
                  href="/privacy-policy"
                  className="flex min-h-[44px] w-full items-center justify-center rounded-xl py-3 text-center text-sm font-semibold text-[var(--jacuzzi-gold,#e6c16a)] underline decoration-[#d4af37]/45 underline-offset-[5px] transition hover:text-[#fde68a] sm:order-3 sm:w-auto sm:px-4 sm:py-2.5"
                  onClick={() => setShowSettings(false)}
                >
                  מדיניות פרטיות
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
