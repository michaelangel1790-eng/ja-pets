/**
 * URLs לנכסי תמונה עם bust למטמון — העלה קובץ חדש תחת public/images ועדכן את המחרוזת v המתאימה.
 */
const TRUCK_PROMO_CACHE = "202602022";

export const truckPromoNobgSrc = `/images/jacuzzi-truck-promo-nobg.png?v=${TRUCK_PROMO_CACHE}`;
export const truckPromoFlatSrc = `/images/jacuzzi-truck-promo-flat.png?v=${TRUCK_PROMO_CACHE}`;

/** לוגו ראשי (Hero, OG, JSON-LD, גלריה) — עדכן את המספר כשמחליפים את הקובץ בדיסק */
const MAIN_LOGO_CACHE = "202602026";

/** מימדי `logo-main-top.png` (אחרי הגדלה ל־720px רוחב + חידוד קל) */
export const mainLogoWidth = 720;
export const mainLogoHeight = 354;

export const mainLogoSrc = `/images/logo-main-top.png?v=${MAIN_LOGO_CACHE}`;

export function mainLogoAbsoluteUrl(origin: string): string {
  const o = origin.replace(/\/$/, "");
  return `${o}/images/logo-main-top.png?v=${MAIN_LOGO_CACHE}`;
}
