/**
 * דחיסת תמונות בדפדפן לפני העלאה — browser-image-compression → WebP, רוחב/גובה עד 1200px, איכות 0.85.
 */
import imageCompression from "browser-image-compression";

const MAX_FILES_PER_UPLOAD = 100;
/** מאפשרים קבצים גדולים יותר לפני דחיסה; בפועל יועלו אחרי דחיסה ל-WebP. */
const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;
const MAX_SIDE = 1200;
const WEBP_QUALITY = 0.85;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function sanitizeBaseName(name: string): string {
  return name
    .replace(/\.[^/.]+$/, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-_]/g, "")
    .slice(0, 48)
    .toLowerCase();
}

export type CompressGalleryFilesResult =
  | { ok: true; files: File[] }
  | { ok: false; error: string };

export type CompressProgressCallback = (percent: number) => void;

/**
 * דוחס כל קובץ ל-WebP לפני שליחה לשרת (לא מעלה את המקור הכבד).
 */
export async function compressFilesForGalleryUpload(
  files: File[],
  options?: { onProgress?: CompressProgressCallback }
): Promise<CompressGalleryFilesResult> {
  const onProgress = options?.onProgress;

  if (files.length === 0) {
    return { ok: false, error: "לא נבחרו קבצים" };
  }
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return { ok: false, error: `אפשר להעלות עד ${MAX_FILES_PER_UPLOAD} תמונות בכל העלאה` };
  }

  const out: File[] = [];
  const total = files.length;
  let done = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = extensionOf(file.name);
    if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXT.has(ext)) {
      return {
        ok: false,
        error: "ניתן להעלות רק קבצי JPG, JPEG, PNG או WEBP"
      };
    }
    if (file.size > MAX_ORIGINAL_BYTES) {
      return {
        ok: false,
        error: "כל תמונה חייבת להיות עד 20MB לפני דחיסה"
      };
    }

    try {
      const blob = await imageCompression(file, {
        maxSizeMB: MAX_ORIGINAL_BYTES / (1024 * 1024),
        maxWidthOrHeight: MAX_SIDE,
        initialQuality: WEBP_QUALITY,
        fileType: "image/webp",
        useWebWorker: true,
        onProgress: (p) => {
          const overall = ((done + p / 100) / total) * 100;
          onProgress?.(Math.min(100, Math.round(overall)));
        }
      });

      const base = sanitizeBaseName(file.name) || "img";
      const fileName = `gallery-${Date.now()}-${i}-${base}.webp`;
      const outFile = new File([blob], fileName, {
        type: "image/webp",
        lastModified: Date.now()
      });
      out.push(outFile);
      done += 1;
      onProgress?.(Math.round((done / total) * 100));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "דחיסת התמונה נכשלה";
      return { ok: false, error: msg };
    }
  }

  return { ok: true, files: out };
}
