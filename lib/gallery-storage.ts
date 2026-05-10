/**
 * Hybrid gallery: files in public/gallery (static) + Vercel Blob uploads (blob manifest).
 * Manifest stores order/metadata + suppressed basenames (hidden static files still on disk).
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, list, put } from "@vercel/blob";
import { type GalleryCategory, type GalleryItem } from "@/data/marketing-data";

const DATA_DIR = path.join(process.cwd(), "data");
const GALLERY_DATA_FILE = path.join(DATA_DIR, "gallery-items.json");
const GALLERY_IMAGES_DIR = path.join(process.cwd(), "public", "images", "gallery");
export const PUBLIC_GALLERY_DIR = path.join(process.cwd(), "public", "gallery");

const BLOB_PREFIX = "jacuzzi-gallery";
export const BLOB_MANIFEST_PATH = `${BLOB_PREFIX}/manifest.json`;
/** גיבוי לפני כל כתיבה — שחזור כשהמניפסט הראשי נפגם */
const BLOB_MANIFEST_BACKUP_PATH = `${BLOB_PREFIX}/manifest-backup.json`;

const STATIC_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export type GallerySource = "static" | "blob";

export type GalleryManifestFile = {
  items: GalleryItem[];
  suppressedStaticBasenames: string[];
};

export function galleryUsesBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function blobToken(): string | undefined {
  const t = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return t || undefined;
}

function stableStaticId(basename: string): string {
  const h = createHash("sha256").update(basename).digest("hex").slice(0, 16);
  return `static-${h}`;
}

export function normalizeGalleryItems(raw: unknown): GalleryItem[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : "";
      const image = typeof row.image === "string" ? row.image : "";
      const category = (typeof row.category === "string" ? row.category : "תספורות") as GalleryCategory;
      const dogType = typeof row.dogType === "string" ? row.dogType : "כלב";
      const treatmentName = typeof row.treatmentName === "string" ? row.treatmentName : "תספורת וטיפוח";
      const caption = typeof row.caption === "string" ? row.caption : "";
      const featured = row.featured === true || row.featured === "true";
      const createdAt = typeof row.createdAt === "string" ? row.createdAt : undefined;
      const width = typeof row.width === "number" ? row.width : undefined;
      const height = typeof row.height === "number" ? row.height : undefined;
      let source: GallerySource | undefined;
      if (row.source === "blob" || row.source === "static") {
        source = row.source;
      }
      if (!id || !image) return null;
      const out: GalleryItem = { id, image, category, dogType, treatmentName, caption, featured };
      if (source) {
        out.source = source;
      }
      if (createdAt) out.createdAt = createdAt;
      if (width !== undefined) out.width = width;
      if (height !== undefined) out.height = height;
      return out;
    })
    .filter((item): item is GalleryItem => item !== null);
}

function parseManifestJson(parsed: unknown): GalleryManifestFile {
  if (Array.isArray(parsed)) {
    return { items: normalizeGalleryItems(parsed), suppressedStaticBasenames: [] };
  }
  if (parsed && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    const items = normalizeGalleryItems(o.items);
    const suppressedRaw = o.suppressedStaticBasenames;
    const suppressed =
      Array.isArray(suppressedRaw) && suppressedRaw.every((x) => typeof x === "string")
        ? (suppressedRaw as string[])
        : [];
    return { items, suppressedStaticBasenames: suppressed };
  }
  return { items: [], suppressedStaticBasenames: [] };
}

async function blobGetText(pathname: string, token: string): Promise<string | null> {
  try {
    const result = await get(pathname, { access: "public", token });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const text = await new Response(result.stream).text();
    return text.trim() ? text : null;
  } catch {
    return null;
  }
}

function tryParseManifestText(text: string): GalleryManifestFile | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    return parseManifestJson(parsed);
  } catch {
    return null;
  }
}

async function repairPrimaryManifestFromData(data: GalleryManifestFile, token: string): Promise<void> {
  await put(BLOB_MANIFEST_PATH, JSON.stringify(data), {
    access: "public",
    token,
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

/**
 * קריאת מניפסט Blob: לא מחזירים ריק בשגיאת JSON (זה גרם לדריסת גלריה מלאה בהעלאה).
 * ניסיון שחזור מ־manifest-backup.json; תיקון אוטומטי של הקובץ הראשי אחרי שחזור מגיבוי.
 */
async function readGalleryManifestBlob(token: string): Promise<GalleryManifestFile> {
  const primaryText = await blobGetText(BLOB_MANIFEST_PATH, token);
  const backupText = await blobGetText(BLOB_MANIFEST_BACKUP_PATH, token);

  if (primaryText) {
    const ok = tryParseManifestText(primaryText);
    if (ok) return ok;
    console.error("[gallery-storage] primary manifest.json is not valid JSON", {
      length: primaryText.length,
      preview: primaryText.slice(0, 200)
    });
  }

  if (backupText) {
    const fromBackup = tryParseManifestText(backupText);
    if (fromBackup) {
      console.warn("[gallery-storage] gallery manifest recovered from manifest-backup.json");
      try {
        await repairPrimaryManifestFromData(fromBackup, token);
      } catch (repairErr) {
        console.error("[gallery-storage] could not rewrite primary manifest after backup recovery", repairErr);
      }
      return fromBackup;
    }
    console.error("[gallery-storage] manifest-backup.json also invalid");
  }

  if (primaryText || backupText) {
    throw new Error("GALLERY_MANIFEST_CORRUPT");
  }

  return { items: [], suppressedStaticBasenames: [] };
}

async function readGalleryManifestFs(): Promise<GalleryManifestFile> {
  const backupPath = path.join(DATA_DIR, "gallery-items.backup.json");

  if (!existsSync(GALLERY_DATA_FILE)) {
    return { items: [], suppressedStaticBasenames: [] };
  }
  try {
    const raw = await readFile(GALLERY_DATA_FILE, "utf8");
    const ok = tryParseManifestText(raw);
    if (ok) return ok;
    console.error("[gallery-storage] gallery-items.json invalid, trying backup");
  } catch {
    /* fall through */
  }

  if (existsSync(backupPath)) {
    try {
      const bak = await readFile(backupPath, "utf8");
      const fromBackup = tryParseManifestText(bak);
      if (fromBackup) {
        console.warn("[gallery-storage] recovered gallery-items.json from gallery-items.backup.json");
        try {
          await writeFile(GALLERY_DATA_FILE, JSON.stringify(fromBackup), "utf8");
        } catch (repairErr) {
          console.error("[gallery-storage] could not repair gallery-items.json", repairErr);
        }
        return fromBackup;
      }
    } catch {
      /* ignore */
    }
  }

  throw new Error("GALLERY_MANIFEST_CORRUPT");
}

export async function readPersistedManifest(): Promise<GalleryManifestFile> {
  const token = blobToken();
  if (token) {
    return readGalleryManifestBlob(token);
  }
  return readGalleryManifestFs();
}

/** Scan public/gallery for image files (manual deploy). */
export async function discoverPublicGalleryFiles(): Promise<GalleryItem[]> {
  if (!existsSync(PUBLIC_GALLERY_DIR)) {
    return [];
  }
  let names: string[];
  try {
    names = await readdir(PUBLIC_GALLERY_DIR);
  } catch {
    return [];
  }
  const images = names
    .filter((n) => STATIC_EXT.has(path.extname(n).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "he"));

  return images.map((basename) => ({
    id: stableStaticId(basename),
    image: `/gallery/${basename}`,
    category: "תספורות" as const,
    dogType: "כלב",
    treatmentName: "תספורת וטיפוח",
    caption: "",
    featured: false,
    source: "static" as const
  }));
}

function publicFileExists(imagePath: string): boolean {
  const clean = imagePath.replace(/^\//, "");
  const fp = path.join(process.cwd(), "public", clean);
  return existsSync(fp);
}

/** רק נתיבי גלריה אמיתיים — לא לוגו/באנרים מתיקיית images הכללית */
function isAllowedGalleryAssetPath(image: string): boolean {
  if (image.startsWith("http://") || image.startsWith("https://")) return true;
  if (image.startsWith("/gallery/")) return true;
  if (image.startsWith("/images/gallery/")) return true;
  return false;
}

/** Drop manifest entries whose files disappeared; normalize source. */
function validatePersistedItem(item: GalleryItem): GalleryItem | null {
  if (!isAllowedGalleryAssetPath(item.image)) return null;

  if (item.image.startsWith("http://") || item.image.startsWith("https://")) {
    return { ...item, source: item.source ?? "blob" };
  }
  if (item.image.startsWith("/gallery/")) {
    const bn = path.basename(item.image);
    const fp = path.join(PUBLIC_GALLERY_DIR, bn);
    if (!existsSync(fp)) return null;
    return { ...item, source: "static" };
  }
  if (item.image.startsWith("/images/gallery/")) {
    if (!publicFileExists(item.image)) return null;
    return { ...item, source: item.source ?? "blob" };
  }
  return null;
}

function mergeDiskStatic(
  persisted: GalleryItem[],
  suppressed: Set<string>,
  discovered: GalleryItem[]
): GalleryItem[] {
  const covered = new Set<string>();
  const result: GalleryItem[] = [];

  for (const item of persisted) {
    const v = validatePersistedItem(item);
    if (!v) continue;
    result.push(v);
    if (v.image.startsWith("/gallery/")) {
      covered.add(path.basename(v.image));
    }
  }

  for (const d of discovered) {
    const bn = path.basename(d.image);
    if (covered.has(bn) || suppressed.has(bn)) continue;
    result.push(d);
  }

  return result;
}

/**
 * Full gallery list: persisted manifest + public/gallery בלבד (אין תמונות דמו/לוגו).
 */
export async function readGalleryItems(): Promise<GalleryItem[]> {
  const manifest = await readPersistedManifest();
  const discovered = await discoverPublicGalleryFiles();
  const suppressed = new Set(manifest.suppressedStaticBasenames);

  if (manifest.items.length === 0 && discovered.length === 0) {
    return [];
  }

  if (manifest.items.length === 0 && discovered.length > 0) {
    return mergeDiskStatic([], suppressed, discovered);
  }

  return mergeDiskStatic(manifest.items, suppressed, discovered);
}

export type RebuildGalleryFromBlobResult = {
  items: GalleryItem[];
  recoveredBlobImageCount: number;
};

/**
 * כשהמניפסט נפגם/ריק אבל הקבצים עדיין ב־Blob — בונה מחדש את הרשימה מכל הקבצים תחת jacuzzi-gallery/images/.
 */
export async function rebuildGalleryManifestFromBlobStorage(): Promise<RebuildGalleryFromBlobResult> {
  const token = blobToken();
  if (!token) {
    throw new Error("NO_BLOB_TOKEN");
  }

  const collected: { url: string; pathname: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({
      prefix: `${BLOB_PREFIX}/images/`,
      token,
      limit: 1000,
      ...(cursor ? { cursor } : {})
    });
    for (const b of page.blobs) {
      if (/\.(webp|jpg|jpeg|png)$/i.test(b.pathname)) {
        collected.push({
          url: b.url,
          pathname: b.pathname,
          uploadedAt: b.uploadedAt
        });
      }
    }
    cursor = page.hasMore && page.cursor ? page.cursor : undefined;
  } while (cursor);

  collected.sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime());

  const blobItems: GalleryItem[] = collected.map((b) => {
    const idSlice = createHash("sha256").update(b.pathname).digest("hex").slice(0, 16);
    return {
      id: `rebuilt-${idSlice}`,
      image: b.url,
      category: "תספורות",
      dogType: "כלב",
      treatmentName: "תספורת וטיפוח",
      caption: "",
      featured: false,
      source: "blob",
      createdAt: b.uploadedAt.toISOString()
    };
  });

  let prev: GalleryManifestFile = { items: [], suppressedStaticBasenames: [] };
  try {
    prev = await readPersistedManifest();
  } catch {
    /* מניפסט לא נקרא — נשמרים רק מה שהחזיר ה־Blob */
  }

  const discovered = await discoverPublicGalleryFiles();
  const merged = mergeDiskStatic(blobItems, new Set(prev.suppressedStaticBasenames), discovered);

  await writeGalleryManifest({
    items: merged,
    suppressedStaticBasenames: prev.suppressedStaticBasenames
  });

  return { items: merged, recoveredBlobImageCount: blobItems.length };
}

async function writeGalleryManifestBlob(data: GalleryManifestFile, token: string): Promise<void> {
  const payload = JSON.stringify(data);

  let previousRaw: string | null = null;
  try {
    previousRaw = await blobGetText(BLOB_MANIFEST_PATH, token);
  } catch {
    previousRaw = null;
  }

  if (previousRaw && tryParseManifestText(previousRaw)) {
    try {
      await put(BLOB_MANIFEST_BACKUP_PATH, previousRaw, {
        access: "public",
        token,
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true
      });
    } catch (backupErr) {
      console.warn("[gallery-storage] writing manifest-backup failed", backupErr);
    }
  }

  await put(BLOB_MANIFEST_PATH, payload, {
    access: "public",
    token,
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true
  });
}

async function ensureDirsFs() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  if (!existsSync(GALLERY_IMAGES_DIR)) {
    await mkdir(GALLERY_IMAGES_DIR, { recursive: true });
  }
}

async function writeGalleryManifestFs(data: GalleryManifestFile): Promise<void> {
  await ensureDirsFs();
  const payload = JSON.stringify(data);
  if (existsSync(GALLERY_DATA_FILE)) {
    try {
      const prev = await readFile(GALLERY_DATA_FILE, "utf8");
      if (prev.trim() && tryParseManifestText(prev)) {
        const bak = path.join(DATA_DIR, "gallery-items.backup.json");
        await writeFile(bak, prev, "utf8");
      }
    } catch {
      /* ignore */
    }
  }
  await writeFile(GALLERY_DATA_FILE, payload, "utf8");
}

export async function writeGalleryManifest(data: GalleryManifestFile): Promise<void> {
  const normalized: GalleryManifestFile = {
    ...data,
    items: data.items.map((item) => ({
      ...item,
      featured: item.featured === true
    }))
  };
  const token = blobToken();
  if (token) {
    await writeGalleryManifestBlob(normalized, token);
    return;
  }
  await writeGalleryManifestFs(normalized);
}

/** Replace ordered items; keeps suppressed list from previous read. */
export async function writeGalleryItems(items: GalleryItem[]): Promise<void> {
  const prev = await readPersistedManifest();
  await writeGalleryManifest({
    items,
    suppressedStaticBasenames: prev.suppressedStaticBasenames
  });
}

/** After deleting an item: update manifest, suppress static basename, remove blob file if needed. */
export async function finalizeGalleryDelete(deleted: GalleryItem, remainingItems: GalleryItem[]): Promise<void> {
  const prev = await readPersistedManifest();
  const suppressed = new Set(prev.suppressedStaticBasenames);

  if (deleted.image.startsWith("/gallery/")) {
    suppressed.add(path.basename(deleted.image));
  }

  await writeGalleryManifest({
    items: remainingItems,
    suppressedStaticBasenames: [...suppressed]
  });

  if (deleted.source === "blob" || deleted.image.startsWith("http://") || deleted.image.startsWith("https://")) {
    await removeGalleryImageFile(deleted.image);
  } else if (deleted.image.startsWith("/images/gallery/")) {
    await removeGalleryImageFile(deleted.image);
  }
}

/** Upload processed WebP bytes — returns public URL or site-relative path. */
export async function persistGalleryImage(buffer: Buffer, fileName: string): Promise<{ imageRef: string }> {
  const token = blobToken();
  if (token) {
    const pathname = `${BLOB_PREFIX}/images/${fileName}`;
    const uploaded = await put(pathname, buffer, {
      access: "public",
      token,
      contentType: "image/webp",
      addRandomSuffix: false,
      allowOverwrite: true
    });
    return { imageRef: uploaded.url };
  }

  await ensureDirsFs();
  const outputPath = path.join(GALLERY_IMAGES_DIR, fileName);
  await writeFile(outputPath, buffer);
  return { imageRef: `/images/gallery/${fileName}` };
}

export async function removeGalleryImageFile(imageRef: string): Promise<void> {
  if (imageRef.startsWith("http://") || imageRef.startsWith("https://")) {
    const token = blobToken();
    if (token) {
      try {
        await del(imageRef, { token });
      } catch {
        try {
          await del(imageRef);
        } catch {
          // ignore
        }
      }
    }
    return;
  }

  if (imageRef.startsWith("/gallery/")) {
    return;
  }

  if (imageRef.startsWith("/images/gallery/")) {
    const fileName = path.basename(imageRef);
    const filePath = path.join(GALLERY_IMAGES_DIR, fileName);
    if (existsSync(filePath)) {
      try {
        await unlink(filePath);
      } catch {
        // ignore
      }
    }
  }
}

export async function ensureGalleryDirsForAudit(): Promise<void> {
  if (!galleryUsesBlob()) {
    await ensureDirsFs();
  }
}
