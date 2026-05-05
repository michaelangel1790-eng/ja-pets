/**
 * מפתחות namespaced — פחות התנגשות עם סקריפטים חיצוניים / תוספים שמשתמשים ב־cookieConsent גנרי.
 * נשמרת תאימות חד־פעמית למפתחות הישנים (מיגרציה אוטומטית בקריאה).
 */
export const COOKIE_LS_CONSENT = "jacuzzi_cookieConsent";
export const COOKIE_LS_ANALYTICS = "jacuzzi_cookieAnalytics";
export const COOKIE_LS_MARKETING = "jacuzzi_cookieMarketing";

const LEGACY_COOKIE_LS_CONSENT = "cookieConsent";
const LEGACY_COOKIE_LS_ANALYTICS = "cookieAnalytics";
const LEGACY_COOKIE_LS_MARKETING = "cookieMarketing";

export const EVENT_CONSENT_UPDATED = "jacuzzi-cookie-consent-updated";
export const EVENT_OPEN_SETTINGS = "jacuzzi-open-cookie-settings";

export type StoredConsent = "accepted_all" | "essential_only" | "custom";

/** ניקוי כל הגרסאות (חדש + legacy) — לאיפוס דרך URL וכדומה */
export function clearAllConsentStorageKeys(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of [
      COOKIE_LS_CONSENT,
      COOKIE_LS_ANALYTICS,
      COOKIE_LS_MARKETING,
      LEGACY_COOKIE_LS_CONSENT,
      LEGACY_COOKIE_LS_ANALYTICS,
      LEGACY_COOKIE_LS_MARKETING
    ]) {
      localStorage.removeItem(key);
    }
  } catch {
    /* storage חסום / שגיאה */
  }
}

function migrateLegacyConsentKeysOnce(): void {
  try {
    const pairs: [string, string][] = [
      [COOKIE_LS_CONSENT, LEGACY_COOKIE_LS_CONSENT],
      [COOKIE_LS_ANALYTICS, LEGACY_COOKIE_LS_ANALYTICS],
      [COOKIE_LS_MARKETING, LEGACY_COOKIE_LS_MARKETING]
    ];
    for (const [next, prev] of pairs) {
      if (localStorage.getItem(next) == null) {
        const oldVal = localStorage.getItem(prev);
        if (oldVal != null) {
          localStorage.setItem(next, oldVal);
          localStorage.removeItem(prev);
        }
      }
    }
  } catch {
    /* ignore */
  }
}

export function getConsentFromStorage(): {
  consent: StoredConsent | null;
  analytics: boolean;
  marketing: boolean;
} {
  if (typeof window === "undefined") {
    return { consent: null, analytics: false, marketing: false };
  }
  try {
    migrateLegacyConsentKeysOnce();
    const raw = localStorage.getItem(COOKIE_LS_CONSENT);
    const valid: StoredConsent[] = ["accepted_all", "essential_only", "custom"];
    const consent = raw && valid.includes(raw as StoredConsent) ? (raw as StoredConsent) : null;
    return {
      consent,
      analytics: localStorage.getItem(COOKIE_LS_ANALYTICS) === "true",
      marketing: localStorage.getItem(COOKIE_LS_MARKETING) === "true"
    };
  } catch {
    return { consent: null, analytics: false, marketing: false };
  }
}

/** האם לאפשר טעינת אנליטיקה (Plausible וכדומה) */
export function shouldLoadAnalytics(): boolean {
  const { consent, analytics } = getConsentFromStorage();
  if (consent === "accepted_all") return true;
  if (consent === "custom" && analytics) return true;
  return false;
}

/** האם לאפשר סקריפטי פרסום/שיווק — לאימות עתידי */
export function shouldLoadMarketing(): boolean {
  const { consent, marketing } = getConsentFromStorage();
  if (consent === "accepted_all") return true;
  if (consent === "custom" && marketing) return true;
  return false;
}

export function dispatchConsentUpdated(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(
      new CustomEvent(EVENT_CONSENT_UPDATED, {
        detail: {
          ...getConsentFromStorage(),
          analyticsAllowed: shouldLoadAnalytics(),
          marketingAllowed: shouldLoadMarketing()
        }
      })
    );
  } catch {
    /* ignore */
  }
}
