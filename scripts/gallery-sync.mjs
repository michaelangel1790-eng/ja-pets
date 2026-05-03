/**
 * סנכרון גלריה סטטית: סורק את public/gallery ומעדכן את data/gallery-items.json
 * הרצה מקומית אחרי הוספת/הסרת קבצי תמונה, ואז commit + deploy.
 *
 * זרימה מומלצת:
 * - הוספת ~100 תמונות: העתק ל-public/gallery, הרץ npm run gallery:sync, בדוק מקומית, deploy.
 * - עדכון שבועי (10–20 תמונות): הוסף/החלף קבצים בתיקייה, הרץ שוב gallery:sync, deploy.
 */
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC_GALLERY = path.join(ROOT, "public", "gallery");
const DATA_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(DATA_DIR, "gallery-items.json");

const STATIC_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function stableStaticId(basename) {
  return `static-${createHash("sha256").update(basename).digest("hex").slice(0, 16)}`;
}

function parseManifest(raw) {
  if (Array.isArray(raw)) {
    return { items: raw, suppressedStaticBasenames: [] };
  }
  if (raw && typeof raw === "object") {
    const items = Array.isArray(raw.items) ? raw.items : [];
    const suppressed = Array.isArray(raw.suppressedStaticBasenames)
      ? raw.suppressedStaticBasenames.filter((x) => typeof x === "string")
      : [];
    return { items, suppressedStaticBasenames: suppressed };
  }
  return { items: [], suppressedStaticBasenames: [] };
}

async function discoverDisk() {
  if (!existsSync(PUBLIC_GALLERY)) return [];
  const names = await readdir(PUBLIC_GALLERY);
  return names
    .filter((n) => STATIC_EXT.has(path.extname(n).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "he"));
}

function itemForBasename(basename) {
  return {
    id: stableStaticId(basename),
    image: `/gallery/${basename}`,
    category: "תספורות",
    dogType: "כלב",
    treatmentName: "תספורת וטיפוח",
    caption: "",
    featured: false,
    source: "static"
  };
}

async function main() {
  let prev = { items: [], suppressedStaticBasenames: [] };
  if (existsSync(OUT_FILE)) {
    try {
      const text = await readFile(OUT_FILE, "utf8");
      prev = parseManifest(JSON.parse(text));
    } catch (e) {
      console.warn("[gallery:sync] לא ניתן לקרוא את הקובץ הקיים, מתחילים מריק:", e.message);
    }
  }

  const suppressed = new Set(prev.suppressedStaticBasenames);
  const diskNames = await discoverDisk();
  const diskSet = new Set(diskNames);

  const kept = [];
  const coveredBasenames = new Set();

  for (const item of prev.items) {
    if (!item || typeof item !== "object") continue;
    const image = typeof item.image === "string" ? item.image : "";
    if (image.startsWith("/gallery/")) {
      const bn = path.basename(image);
      if (!diskSet.has(bn) || suppressed.has(bn)) continue;
      kept.push({
        ...item,
        id: typeof item.id === "string" && item.id ? item.id : stableStaticId(bn),
        image: `/gallery/${bn}`,
        source: "static"
      });
      coveredBasenames.add(bn);
      continue;
    }
    kept.push(item);
  }

  const additions = [];
  for (const basename of diskNames) {
    if (coveredBasenames.has(basename) || suppressed.has(basename)) continue;
    additions.push(itemForBasename(basename));
  }

  const next = {
    items: [...kept, ...additions],
    suppressedStaticBasenames: [...suppressed]
  };

  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  await writeFile(OUT_FILE, `${JSON.stringify(next, null, 2)}\n`, "utf8");

  console.log(
    `[gallery:sync] נכתב ${OUT_FILE} — ${next.items.length} פריטים (${additions.length} חדשים מ-public/gallery, ${kept.length} נשמרו מהמניפסט).`
  );
}

main().catch((err) => {
  console.error("[gallery:sync] נכשל:", err);
  process.exit(1);
});
