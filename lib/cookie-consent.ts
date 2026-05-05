/** מפתחות localStorage לפי דרישת המוצר */
export const COOKIE_LS_CONSENT = "cookieConsent";
export const COOKIE_LS_ANALYTICS = "cookieAnalytics";
export const COOKIE_LS_MARKETING = "cookieMarketing";

export const EVENT_CONSENT_UPDATED = "jacuzzi-cookie-consent-updated";
export const EVENT_OPEN_SETTINGS = "jacuzzi-open-cookie-settings";

export type StoredConsent = "accepted_all" | "essential_only" | "custom";

export function getConsentFromStorage(): {
  consent: StoredConsent | null;
  analytics: boolean;
  marketing: boolean;
} {
  if (typeof window === "undefined") {
    return { consent: null, analytics: false, marketing: false };
  }
  const raw = localStorage.getItem(COOKIE_LS_CONSENT);
  const valid: StoredConsent[] = ["accepted_all", "essential_only", "custom"];
  const consent = raw && valid.includes(raw as StoredConsent) ? (raw as StoredConsent) : null;
  return {
    consent,
    analytics: localStorage.getItem(COOKIE_LS_ANALYTICS) === "true",
    marketing: localStorage.getItem(COOKIE_LS_MARKETING) === "true"
  };
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
  window.dispatchEvent(
    new CustomEvent(EVENT_CONSENT_UPDATED, {
      detail: {
        ...getConsentFromStorage(),
        analyticsAllowed: shouldLoadAnalytics(),
        marketingAllowed: shouldLoadMarketing()
      }
    })
  );
}
