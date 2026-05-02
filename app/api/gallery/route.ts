import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { createHmac, timingSafeEqual } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { galleryItems as fallbackGalleryItems, type GalleryItem } from "@/data/marketing-data";
import { getAdminCode } from "@/lib/admin-env";
import { resolveAdminSessionSecret } from "@/lib/admin-session-secret";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const GALLERY_DATA_FILE = path.join(DATA_DIR, "gallery-items.json");
const GALLERY_AUDIT_LOG_FILE = path.join(DATA_DIR, "gallery-admin-audit.log");
const GALLERY_IMAGES_DIR = path.join(process.cwd(), "public", "images", "gallery");
const WATERMARK_LOGO_PATH = path.join(process.cwd(), "public", "images", "logo-main-top.png");
const MAX_FAILED_ATTEMPTS = 10;
const BLOCK_DURATION_MS = 48 * 60 * 60 * 1000;
const MAX_FILES_PER_UPLOAD = 12;
const failedAttemptsByClient = new Map<string, { count: number; blockedUntil: number }>();
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

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

function normalizeGalleryItems(raw: unknown): GalleryItem[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : "";
      const image = typeof row.image === "string" ? row.image : "";
      const category = typeof row.category === "string" ? row.category : "תספורות";
      const dogType = typeof row.dogType === "string" ? row.dogType : "כלב";
      const treatmentName = typeof row.treatmentName === "string" ? row.treatmentName : "תספורת וטיפוח";
      const caption = typeof row.caption === "string" ? row.caption : "";
      const featured = row.featured === true;
      if (!id || !image) return null;
      return { id, image, category, dogType, treatmentName, caption, featured } as GalleryItem;
    })
    .filter((item): item is GalleryItem => item !== null);
}

function sortGalleryItems(items: GalleryItem[]): GalleryItem[] {
  const featuredItems = items.filter((item) => item.featured);
  const regularItems = items.filter((item) => !item.featured);
  return [...featuredItems, ...regularItems];
}

async function ensureDirs() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  if (!existsSync(GALLERY_IMAGES_DIR)) {
    await mkdir(GALLERY_IMAGES_DIR, { recursive: true });
  }
}

async function readGalleryItems(): Promise<GalleryItem[]> {
  if (!existsSync(GALLERY_DATA_FILE)) {
    return [...fallbackGalleryItems];
  }
  try {
    const raw = await readFile(GALLERY_DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length === 0) {
      return [];
    }
    const normalized = normalizeGalleryItems(parsed);
    return normalized.length > 0 ? normalized : [...fallbackGalleryItems];
  } catch {
    return [...fallbackGalleryItems];
  }
}

async function writeGalleryItems(items: GalleryItem[]) {
  await ensureDirs();
  await writeFile(GALLERY_DATA_FILE, JSON.stringify(items, null, 2), "utf8");
}

async function logGalleryAdminAction(
  request: Request,
  action: "verify-code" | "reorder" | "toggle-featured" | "delete" | "upload",
  payload: Record<string, unknown> = {}
) {
  await ensureDirs();
  const entry = {
    at: new Date().toISOString(),
    action,
    clientKey: getClientKey(request),
    ...payload
  };
  await appendFile(GALLERY_AUDIT_LOG_FILE, `${JSON.stringify(entry)}\n`, "utf8");
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
  const items = sortGalleryItems(await readGalleryItems());
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const adminCode = getAdminCode();
  const clientKey = getClientKey(request);
  const blockedUntil = getBlockedUntil(clientKey);
  if (blockedUntil > 0) {
    const minutesLeft = Math.ceil((blockedUntil - Date.now()) / 60000);
    return NextResponse.json(
      { error: `נחסמת זמנית אחרי יותר מדי ניסיונות שגויים. נסה שוב בעוד כ-${minutesLeft} דקות` },
      { status: 429 }
    );
  }

  if (!adminCode) {
    return NextResponse.json({ error: "קוד מנהל לא הוגדר בשרת" }, { status: 500 });
  }

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      action?: "verify-code" | "reorder" | "toggle-featured";
      code?: string;
      orderedIds?: string[];
      id?: string;
      featured?: boolean;
    };

    if (body.action === "verify-code") {
      if ((body.code || "").trim() !== adminCode) {
        registerFailedAttempt(clientKey);
        return NextResponse.json({ error: "קוד מנהל שגוי" }, { status: 401 });
      }
      clearFailedAttempts(clientKey);
      await logGalleryAdminAction(request, "verify-code", { ok: true });
      const sessionToken = createAdminSessionToken("gallery-admin");
      if (!sessionToken) {
        return NextResponse.json({ error: "לא ניתן ליצור סשן מנהל - בדקו את תצורת השרת" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, sessionToken });
    }

    if (body.action === "reorder") {
      if (!isAuthorizedRequest(request, body.code, adminCode)) {
        registerFailedAttempt(clientKey);
        return NextResponse.json({ error: "קוד מנהל שגוי" }, { status: 401 });
      }
      clearFailedAttempts(clientKey);
      if (!Array.isArray(body.orderedIds) || body.orderedIds.length === 0) {
        return NextResponse.json({ error: "חסר סדר תמונות לעדכון" }, { status: 400 });
      }

      const existing = await readGalleryItems();
      const byId = new Map(existing.map((item) => [item.id, item] as const));
      const uniqueRequested = Array.from(new Set(body.orderedIds.filter((id) => typeof id === "string" && id.trim())));
      const knownRequested = uniqueRequested.filter((id) => byId.has(id));

      if (knownRequested.length === 0) {
        return NextResponse.json({ error: "לא נמצאו תמונות לסידור מחדש" }, { status: 400 });
      }

      const remaining = existing.map((item) => item.id).filter((id) => !knownRequested.includes(id));
      const finalOrderIds = [...knownRequested, ...remaining];
      const reordered = finalOrderIds
        .map((id) => byId.get(id))
        .filter((item): item is GalleryItem => Boolean(item));

      await writeGalleryItems(reordered);
      await logGalleryAdminAction(request, "reorder", { imageCount: reordered.length });
      return NextResponse.json({
        ok: true,
        message: "סדר התמונות עודכן בהצלחה",
        items: sortGalleryItems(reordered)
      });
    }

    if (body.action === "toggle-featured") {
      if (!isAuthorizedRequest(request, body.code, adminCode)) {
        registerFailedAttempt(clientKey);
        return NextResponse.json({ error: "קוד מנהל שגוי" }, { status: 401 });
      }
      clearFailedAttempts(clientKey);
      const id = (body.id || "").trim();
      if (!id) {
        return NextResponse.json({ error: "חסר מזהה תמונה" }, { status: 400 });
      }

      const existing = await readGalleryItems();
      const itemIndex = existing.findIndex((item) => item.id === id);
      if (itemIndex < 0) {
        return NextResponse.json({ error: "התמונה לא נמצאה בגלריה" }, { status: 404 });
      }

      const nextFeatured = typeof body.featured === "boolean" ? body.featured : !Boolean(existing[itemIndex]?.featured);
      const updated = existing.map((item, index) => (index === itemIndex ? { ...item, featured: nextFeatured } : item));
      await writeGalleryItems(updated);
      await logGalleryAdminAction(request, "toggle-featured", { id, featured: nextFeatured });

      return NextResponse.json({
        ok: true,
        message: nextFeatured ? "התמונה סומנה כמובילה" : "הוסר סימון התמונה המובילה",
        items: sortGalleryItems(updated)
      });
    }

    return NextResponse.json({ error: "פעולה לא נתמכת" }, { status: 400 });
  }

  const formData = await request.formData();
  const action = String(formData.get("action") || "");
  const code = String(formData.get("code") || "").trim();

  if (action !== "upload" && action !== "delete") {
    return NextResponse.json({ error: "פעולה לא נתמכת" }, { status: 400 });
  }
  if (!isAuthorizedRequest(request, code, adminCode)) {
    registerFailedAttempt(clientKey);
    return NextResponse.json({ error: "קוד מנהל שגוי" }, { status: 401 });
  }
  clearFailedAttempts(clientKey);

  if (action === "delete") {
    const id = String(formData.get("id") || "").trim();
    if (!id) {
      return NextResponse.json({ error: "חסר מזהה תמונה למחיקה" }, { status: 400 });
    }

    const existing = await readGalleryItems();
    const toDelete = existing.find((item) => item.id === id);
    if (!toDelete) {
      return NextResponse.json({ error: "התמונה לא נמצאה בגלריה" }, { status: 404 });
    }

    const updated = existing.filter((item) => item.id !== id);
    await writeGalleryItems(updated);

    if (toDelete.image.startsWith("/images/gallery/")) {
      const fileName = path.basename(toDelete.image);
      const filePath = path.join(GALLERY_IMAGES_DIR, fileName);
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
        } catch {
          // Keep gallery JSON updated even if file deletion fails.
        }
      }
    }

    await logGalleryAdminAction(request, "delete", { id, image: toDelete.image });

    return NextResponse.json({
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
    return NextResponse.json({ error: "לא נבחרו תמונות להעלאה" }, { status: 400 });
  }
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return NextResponse.json(
      { error: `אפשר להעלות עד ${MAX_FILES_PER_UPLOAD} תמונות בכל העלאה` },
      { status: 400 }
    );
  }

  await ensureDirs();
  const existing = await readGalleryItems();
  const created: GalleryItem[] = [];
  const now = Date.now();
  const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  const allowedExts = new Set([".jpg", ".jpeg", ".png", ".webp"]);

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const originalName = file.name || `image-${index + 1}.jpg`;
    const ext = (path.extname(originalName) || ".jpg").toLowerCase();
    if (!allowedMimeTypes.has(file.type) || !allowedExts.has(ext)) {
      return NextResponse.json({ error: "ניתן להעלות רק קבצי JPG, JPEG, PNG או WEBP" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "כל תמונה חייבת להיות עד 10MB" }, { status: 400 });
    }

    const safeBase = slugifyFileName(originalName) || `gallery-${now}-${index + 1}`;
    const fileName = `${now}-${index + 1}-${safeBase}.webp`;
    const outputPath = path.join(GALLERY_IMAGES_DIR, fileName);
    const imagePath = `/images/gallery/${fileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const watermarkedBuffer = await addWatermarkToUpload(buffer);
    await writeFile(outputPath, watermarkedBuffer);

    created.push({
      id: `g-${now}-${index + 1}`,
      image: imagePath,
      category: "תספורות",
      dogType: "כלב",
      treatmentName: "תספורת וטיפוח",
      caption: safeCaption,
      featured: false
    });
  }

  const updated = [...created, ...existing];
  await writeGalleryItems(updated);
  await logGalleryAdminAction(request, "upload", { uploadedCount: created.length, caption: safeCaption || null });

  return NextResponse.json({
    ok: true,
    message: "התמונה נוספה בהצלחה",
    items: sortGalleryItems(updated)
  });
}
