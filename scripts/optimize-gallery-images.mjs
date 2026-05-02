import { existsSync } from "node:fs";
import { readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const galleryDir = path.join(projectRoot, "public", "images", "gallery");
const galleryJsonPath = path.join(projectRoot, "data", "gallery-items.json");
const allowedInputExts = new Set([".jpg", ".jpeg", ".png"]);

async function convertFileToWebp(inputPath, outputPath) {
  await sharp(inputPath, { failOn: "none" })
    .rotate()
    .webp({ quality: 84, effort: 6 })
    .toFile(outputPath);
}

async function optimizeGalleryImages() {
  if (!existsSync(galleryDir)) {
    console.log("Gallery directory not found, skipping.");
    return;
  }

  if (!existsSync(galleryJsonPath)) {
    console.log("gallery-items.json not found, skipping.");
    return;
  }

  const raw = await readFile(galleryJsonPath, "utf8");
  const items = JSON.parse(raw);
  if (!Array.isArray(items)) {
    throw new Error("gallery-items.json is not an array");
  }

  const filesInGallery = new Set(await readdir(galleryDir));
  let convertedCount = 0;
  let updatedItems = 0;

  for (const item of items) {
    if (!item || typeof item !== "object" || typeof item.image !== "string") continue;
    if (!item.image.startsWith("/images/gallery/")) continue;

    const oldName = path.basename(item.image);
    const oldExt = path.extname(oldName).toLowerCase();
    if (!allowedInputExts.has(oldExt)) continue;

    const oldPath = path.join(galleryDir, oldName);
    if (!filesInGallery.has(oldName) || !existsSync(oldPath)) continue;

    const base = oldName.replace(/\.[^/.]+$/, "");
    const webpName = `${base}.webp`;
    const webpPath = path.join(galleryDir, webpName);

    await convertFileToWebp(oldPath, webpPath);
    await unlink(oldPath);

    item.image = `/images/gallery/${webpName}`;
    filesInGallery.delete(oldName);
    filesInGallery.add(webpName);
    convertedCount += 1;
    updatedItems += 1;
  }

  await writeFile(galleryJsonPath, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  console.log(`Converted ${convertedCount} file(s) to WebP and updated ${updatedItems} gallery item(s).`);
}

optimizeGalleryImages().catch((error) => {
  console.error("Gallery optimization failed:", error);
  process.exitCode = 1;
});
