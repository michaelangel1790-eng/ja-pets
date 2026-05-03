import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { appendFile, mkdir } from "node:fs/promises";
import { createHmac, timingSafeEqual } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import type { GalleryItem } from "@/data/marketing-data";
import { adminConfigurationErrorResponse } from "@/lib/admin-configuration";
import { getAdminCode } from "@/lib/admin-env";
import {
  blobToken,
  ensureGalleryDirsForAudit,
  finalizeGalleryDelete,
  galleryUsesBlob,
  persistGalleryImage,
  readGalleryItems,
  writeGalleryItems
} from "@/lib/gallery-storage";
import { resolveAdminSessionSecret } from "@/lib/admin-session-secret";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const GALLERY_AUDIT_LOG_FILE = path.join(DATA_DIR, "gallery-admin-audit.log");
const WATERMARK_LOGO_PATH = path.join(process.cwd(), "public", "images", "logo-main-top.png");
const MAX_FAILED_ATTEMPTS = 10;
const BLOCK_DURATION_MS = 48 * 60 * 60 * 1000;
const failedAttemptsByClient = new Map<string, { count: number; blockedUntil: number }>();
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_FILES_PER_UPLOAD = 10;
const MAX_BYTES_PER_IMAGE_ORIGINAL = 5 * 1024 * 1024;

/** Vercel serverless ללא Blob — כתיבה לקובץ/דיסק לא נשמרת בין הפעלות */
const FREE_HOSTING_GALLERY_WRITE_HE =
  "העלאת תמונות דרך האתר אינה זמינה באחסון החינמי. יש להוסיף תמונות לתיקיית public/gallery ולבצע Deploy מחדש.";

function isVercelWithoutPersistentGalleryWrites() {
  return process.env.VERCEL === "1" && !blobToken();
}

function galleryJson(body: unknown, init?: ResponseInit) {
  const initHeaders = init?.headers;
  const merged: Record<string, string> = { "Cache-Control": "private, no-store, max-age=0" };
  if (initHeaders && typeof initHeaders === "object" && !(initHeaders instanceof Headers)) {
    Object.assign(merged, initHeaders as Record<string, string>);
  }
  return NextResponse.json(body, { ...init, headers: merged });
}

function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = (forwarded.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim();
  const userAgent = (request.headers.get("user-agent") || "unknown").slice(0, 180);
  return `${ip}::${userAgent}`;
}

function getBlockedUntil(clientKey: string) {
  const state = failedAttemptsByClient.get(clientKey);
  if (!state) return 0;
  if (state.blockedUntil > Date.now()) return state.blockedUntil;
  if (state.blockedUntil > 0) {
    failedAttemptsByClient.delete(clientKey);
  }
  return 0;
}

function registerFailedAttempt(clientKey: string) {
  const now = Date.now();
  const state = failedAttemptsByClient.get(clientKey) ?? { count: 0, blockedUntil: 0 };
  const nextCount = state.count + 1;
  if (nextCount >= MAX_FAILED_ATTEMPTS) {
    failedAttemptsByClient.set(clientKey, { count: nextCount, blockedUntil: now + BLOCK_DURATION_MS });
    return true;
  }
  failedAttemptsByClient.set(clientKey, { count: nextCount, blockedUntil: 0 });
  return false;
}

function clearFailedAttempts(clientKey: string) {
  failedAttemptsByClient.delete(clientKey);
}

function base64url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function getSessionSecret() {
  return resolveAdminSessionSecret();
}

function createAdminSessionToken(scope: string) {
  const sessionSecret = getSessionSecret();
  if (!sessionSecret) return null;
  const payload = JSON.stringify({ scope, exp: Date.now() + ADMIN_SESSION_TTL_MS });
  const encoded = base64url(payload);
  const signature = createHmac("sha256", sessionSecret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyAdminSessionToken(token: string | null | undefined, scope: string) {
  const sessionSecret = getSessionSecret();
  if (!sessionSecret) return false;
  if (!token || !token.includes(".")) return false;
  const [encoded, providedSig] = token.split(".");
  if (!encoded || !providedSig) return false;
  const expectedSig = createHmac("sha256", sessionSecret).update(encoded).digest("base64url");
  const provided = Buffer.from(providedSig);
  const expected = Buffer.from(expectedSig);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return false;
  try {
    const decoded = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as { scope?: string; exp?: number };
    if (parsed.scope !== scope) return false;
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

function isAuthorizedRequest(request: Request, codeFromBody: string | undefined, adminCode: string) {
  const sessionToken = request.headers.get("x-admin-session");
  if (verifyAdminSessionToken(sessionToken, "gallery-admin")) {
    return true;
  }
  return (codeFromBody || "").trim() === adminCode;
}

function sortGalleryItems(items: GalleryItem[]): GalleryItem[] {
  const featuredItems = items.filter((item) => item.featured);
  const regularItems = items.filter((item) => !item.featured);
  return [...featuredItems, ...regularItems];
}

async function logGalleryAdminAction(
  request: Request,
  action: "verify-code" | "reorder" | "toggle-featured" | "delete" | "upload",
  payload: Record<string, unknown> = {}
) {
  const entry = {
    at: new Date().toISOString(),
    action,
    clientKey: getClientKey(request),
    ...payload
  };
  if (galleryUsesBlob()) {
    console.info("[gallery-admin]", JSON.stringify(entry));
    return;
  }
  try {
    await ensureGalleryDirsForAudit();
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR, { recursive: true });
    }
    await appendFile(GALLERY_AUDIT_LOG_FILE, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (err) {
    console.error("[gallery-admin audit]", err);
  }
}

function slugifyFileName(baseName: string) {
  return baseName
    .replace(/\.[^/.]+$/, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-_]/g, "")
    .slice(0, 60)
    .toLowerCase();
}

async function addWatermarkToUpload(buffer: Buffer) {
  if (!existsSync(WATERMARK_LOGO_PATH)) {
    return buffer;
  }

  const baseImage = sharp(buffer, { failOn: "none" });
  const metadata = await baseImage.metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  if (!width || !height) {
    return buffer;
  }

  const watermarkWidth = Math.max(72, Math.round(width * 0.16));
  const watermark = await sharp(WATERMARK_LOGO_PATH)
    .resize({ width: watermarkWidth, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
    .sharpen(0.4)
    .png()
    .toBuffer();

  const watermarkMeta = await sharp(watermark).metadata();
  const wmWidth = watermarkMeta.width || watermarkWidth;
  const wmHeight = watermarkMeta.height || Math.round(watermarkWidth * 0.4);
  const margin = Math.max(8, Math.round(Math.min(width, height) * 0.02));
  const left = Math.max(0, width - wmWidth - margin);
  const top = Math.max(0, height - wmHeight - margin);

  const compositePipeline = sharp(buffer, { failOn: "none" }).composite([
    {
      input: watermark,
      left,
      top
    }
  ]);

  return compositePipeline.webp({ quality: 86, effort: 6 }).toBuffer();
}

export async function GET() {
  try {
    const items = sortGalleryItems(await readGalleryItems());
    return galleryJson({ items });
  } catch (error) {
    console.error("[api/gallery GET]", error);
    return galleryJson(
      { error: "לא ניתן לטעון את הגלריה כעת. נסה שוב בעוד רגע.", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const clientKey = getClientKey(request);
    const blockedUntil = getBlockedUntil(clientKey);
    if (blockedUntil > 0) {
      const minutesLeft = Math.ceil((blockedUntil - Date.now()) / 60000);
      return galleryJson(
        { error: `נחסמת זמנית אחרי יותר מדי ניסיונות שגויים. נסה שוב בעוד כ-${minutesLeft} דקות` },
        { status: 429 }
      );
    }

    const configErr = adminConfigurationErrorResponse();
    if (configErr) return configErr;

    const adminCode = getAdminCode();

    if (contentType.includes("application/json")) {
      let rawText: string;
      try {
        rawText = await request.text();
      } catch {
        return galleryJson({ error: "בקשה לא תקינה" }, { status: 400 });
      }
      if (!rawText.trim()) {
        return galleryJson({ error: "בקשה לא תקינה" }, { status: 400 });
      }

      let body: {
        action?: "verify-code" | "reorder" | "toggle-featured";
        code?: string;
        orderedIds?: string[];
        id?: string;
        featured?: boolean;
      };
      try {
        body = JSON.parse(rawText) as {
          action?: "verify-code" | "reorder" | "toggle-featured";
          code?: string;
          orderedIds?: string[];
          id?: string;
          featured?: boolean;
        };
      } catch {
        return galleryJson({ error: "בקשה לא תקינה" }, { status: 400 });
      }

      if (body.action === "verify-code") {
        if ((body.code || "").trim() !== adminCode) {
          registerFailedAttempt(clientKey);
          return galleryJson({ error: "קוד מנהל שגוי" }, { status: 401 });
        }
        clearFailedAttempts(clientKey);
        try {
          await logGalleryAdminAction(request, "verify-code", { ok: true });
        } catch (auditErr) {
          console.error("[api/gallery verify-code audit]", auditErr);
        }
        const sessionToken = createAdminSessionToken("gallery-admin");
        if (!sessionToken) {
          return galleryJson({ error: "קוד מנהל לא הוגדר בשרת" }, { status: 500 });
        }
        return galleryJson({
          ok: true,
          message: "הקוד אומת בהצלחה",
          token: sessionToken,
          sessionToken
        });
      }

      if (body.action === "reorder") {
        if (!isAuthorizedRequest(request, body.code, adminCode)) {
          registerFailedAttempt(clientKey);
          return galleryJson({ error: "קוד מנהל שגוי" }, { status: 401 });
        }
        clearFailedAttempts(clientKey);
        if (isVercelWithoutPersistentGalleryWrites()) {
          return galleryJson({ error: FREE_HOSTING_GALLERY_WRITE_HE }, { status: 503 });
        }
        if (!Array.isArray(body.orderedIds) || body.orderedIds.length === 0) {
          return galleryJson({ error: "חסר סדר תמונות לעדכון" }, { status: 400 });
        }

        const existing = await readGalleryItems();
        const byId = new Map(existing.map((item) => [item.id, item] as const));
        const uniqueRequested = Array.from(new Set(body.orderedIds.filter((id) => typeof id === "string" && id.trim())));
        const knownRequested = uniqueRequested.filter((id) => byId.has(id));

        if (knownRequested.length === 0) {
          return galleryJson({ error: "לא נמצאו תמונות לסידור מחדש" }, { status: 400 });
        }

        const remaining = existing.map((item) => item.id).filter((id) => !knownRequested.includes(id));
        const finalOrderIds = [...knownRequested, ...remaining];
        const reordered = finalOrderIds
          .map((id) => byId.get(id))
          .filter((item): item is GalleryItem => Boolean(item));

        await writeGalleryItems(reordered);
        await logGalleryAdminAction(request, "reorder", { imageCount: reordered.length });
        return galleryJson({
          ok: true,
          message: "סדר התמונות עודכן בהצלחה",
          items: sortGalleryItems(reordered)
        });
      }

      if (body.action === "toggle-featured") {
        if (!isAuthorizedRequest(request, body.code, adminCode)) {
          registerFailedAttempt(clientKey);
          return galleryJson({ error: "קוד מנהל שגוי" }, { status: 401 });
        }
        clearFailedAttempts(clientKey);
        if (isVercelWithoutPersistentGalleryWrites()) {
          return galleryJson({ error: FREE_HOSTING_GALLERY_WRITE_HE }, { status: 503 });
        }
        const id = (body.id || "").trim();
        if (!id) {
          return galleryJson({ error: "חסר מזהה תמונה" }, { status: 400 });
        }

        const existing = await readGalleryItems();
        const itemIndex = existing.findIndex((item) => item.id === id);
        if (itemIndex < 0) {
          return galleryJson({ error: "התמונה לא נמצאה בגלריה" }, { status: 404 });
        }

        const wantFeatured =
          typeof body.featured === "boolean"
            ? body.featured
            : !Boolean(existing[itemIndex]?.featured);

        /** מובילה אחת בלבד: הפעלה מבטלת כוכב מכל השאר; כיבוי רק על הפריט הנוכחי */
        let updated: GalleryItem[];
        if (wantFeatured) {
          updated = existing.map((item) =>
            item.id === id ? { ...item, featured: true } : { ...item, featured: false }
          );
        } else {
          updated = existing.map((item) => (item.id === id ? { ...item, featured: false } : item));
        }

        try {
          await writeGalleryItems(updated);
        } catch (persistErr) {
          console.error("[api/gallery toggle-featured persist]", persistErr);
          return galleryJson(
            { error: "שמירת התמונה המובילה נכשלה. נסה שוב בעוד רגע." },
            { status: 500 }
          );
        }

        await logGalleryAdminAction(request, "toggle-featured", { id, featured: wantFeatured });

        return galleryJson({
          ok: true,
          message: "תמונה מובילה עודכנה בהצלחה",
          items: sortGalleryItems(updated)
        });
      }

      return galleryJson({ error: "פעולה לא נתמכת" }, { status: 400 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return galleryJson({ error: "בקשה לא תקינה" }, { status: 400 });
    }
    const action = String(formData.get("action") || "");
    const code = String(formData.get("code") || "").trim();

    if (action !== "upload" && action !== "delete") {
      return galleryJson({ error: "פעולה לא נתמכת" }, { status: 400 });
    }
    if (!isAuthorizedRequest(request, code, adminCode)) {
      registerFailedAttempt(clientKey);
      return galleryJson({ error: "קוד מנהל שגוי" }, { status: 401 });
    }
    clearFailedAttempts(clientKey);

    if (isVercelWithoutPersistentGalleryWrites()) {
      return galleryJson({ error: FREE_HOSTING_GALLERY_WRITE_HE }, { status: 503 });
    }

    if (action === "delete") {
      const id = String(formData.get("id") || "").trim();
      if (!id) {
        return galleryJson({ error: "חסר מזהה תמונה למחיקה" }, { status: 400 });
      }

      const existing = await readGalleryItems();
      const toDelete = existing.find((item) => item.id === id);
      if (!toDelete) {
        return galleryJson({ error: "התמונה לא נמצאה בגלריה" }, { status: 404 });
      }

      const updated = existing.filter((item) => item.id !== id);

      try {
        await finalizeGalleryDelete(toDelete, updated);
      } catch (delErr) {
        console.error("[api/gallery delete]", delErr);
        return galleryJson(
          { error: "מחיקת התמונה מהגלריה נכשלה. נסה שוב בעוד רגע." },
          { status: 500 }
        );
      }

      await logGalleryAdminAction(request, "delete", { id, image: toDelete.image });

      return galleryJson({
        ok: true,
        message: "התמונה נמחקה בהצלחה",
        items: sortGalleryItems(updated)
      });
    }

  const files = formData.getAll("images").filter((file): file is File => file instanceof File);
  const caption = String(formData.get("caption") || "").trim();
  const allowedCaptions = new Set(["לפני / אחרי", "תספורת", "רחצה וטיפוח", "עבודה מיוחדת"]);
  const safeCaption = allowedCaptions.has(caption) ? caption : "";
  if (files.length === 0) {
    return galleryJson({ error: "לא נבחרו תמונות להעלאה" }, { status: 400 });
  }
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return galleryJson(
      { error: `אפשר להעלות עד ${MAX_FILES_PER_UPLOAD} תמונות בכל העלאה` },
      { status: 400 }
    );
  }

  const existing = await readGalleryItems();
  const created: GalleryItem[] = [];
  const now = Date.now();
  const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/jpg"]);
  const allowedExts = new Set([".jpg", ".jpeg", ".png", ".webp"]);

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const originalName = file.name || `image-${index + 1}.jpg`;
    const ext = (path.extname(originalName) || ".jpg").toLowerCase();
    if (!allowedMimeTypes.has(file.type) || !allowedExts.has(ext)) {
      return galleryJson({ error: "ניתן להעלות רק קבצי JPG, JPEG, PNG או WEBP" }, { status: 400 });
    }
    if (file.size > MAX_BYTES_PER_IMAGE_ORIGINAL) {
      return galleryJson(
        { error: "כל תמונה חייבת להיות עד 5MB לפני דחיסה בדפדפן" },
        { status: 400 }
      );
    }

    const safeBase = slugifyFileName(originalName) || `gallery-${now}-${index + 1}`;
    const fileName = `${now}-${index + 1}-${safeBase}.webp`;
    const buffer = Buffer.from(await file.arrayBuffer());
    let watermarkedBuffer: Buffer;
    try {
      watermarkedBuffer = await addWatermarkToUpload(buffer);
    } catch {
      return galleryJson(
        { error: "עיבוד התמונה נכשל. נסה קובץ אחר או פנה למנהל האתר." },
        { status: 500 }
      );
    }

    let imageRef: string;
    try {
      const { imageRef: ref } = await persistGalleryImage(watermarkedBuffer, fileName);
      imageRef = ref;
    } catch (persistErr) {
      console.error("[api/gallery upload persist]", persistErr);
      return galleryJson({ error: "שמירת התמונה נכשלה. נסה שוב או פנה למנהל האתר." }, { status: 500 });
    }

    let wmWidth: number | undefined;
    let wmHeight: number | undefined;
    try {
      const md = await sharp(watermarkedBuffer).metadata();
      wmWidth = md.width ?? undefined;
      wmHeight = md.height ?? undefined;
    } catch {
      // ignore metadata failure
    }

    created.push({
      id: `g-${now}-${index + 1}`,
      image: imageRef,
      category: "תספורות",
      dogType: "כלב",
      treatmentName: "תספורת וטיפוח",
      caption: safeCaption,
      featured: false,
      source: "blob",
      createdAt: new Date().toISOString(),
      width: wmWidth,
      height: wmHeight
    });
  }

  const updated = [...created, ...existing];
  await writeGalleryItems(updated);
  await logGalleryAdminAction(request, "upload", { uploadedCount: created.length, caption: safeCaption || null });

  return galleryJson({
    ok: true,
    message: "התמונה נוספה בהצלחה",
    items: sortGalleryItems(updated)
  });
  } catch (error) {
    console.error("[api/gallery POST]", error);
    return galleryJson(
      { error: "לא ניתן להשלים את הפעולה כעת. נסה שוב בעוד רגע." },
      { status: 500 }
    );
  }
}
