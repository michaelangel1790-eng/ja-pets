/**
 * יוצר app/icon.png (favicon). תמונת OG: החלף ידנית את public/og-image.jpg.
 * הרצה: node scripts/generate-seo-assets.mjs
 */
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

await mkdir(path.join(root, "public"), { recursive: true });

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#141418"/>
  <text x="16" y="22" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#c9a227">J</text>
</svg>`;

await sharp(Buffer.from(iconSvg)).png().toFile(path.join(root, "app", "icon.png"));

console.log("Wrote app/icon.png (OG image: replace public/og-image.jpg manually)");
