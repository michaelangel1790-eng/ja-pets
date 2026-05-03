/** כיתובי גלריה מותרים — זהים בשרת ובממשק מנהל */
export const GALLERY_ALLOWED_CAPTIONS = [
  "לפני / אחרי",
  "תספורת",
  "דילול וטיפוח",
  "רחצה וטיפוח",
  "עבודה מיוחדת"
] as const;

const CAPTION_SET = new Set<string>(GALLERY_ALLOWED_CAPTIONS);

export function sanitizeGalleryCaption(raw: string | undefined | null): string {
  const t = (raw ?? "").trim();
  return CAPTION_SET.has(t) ? t : "";
}
