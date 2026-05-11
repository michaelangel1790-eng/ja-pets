/**
 * יוצר public/og-image.jpg ו-app/icon.png (תצוגת שיתוף + favicon).
 * הרצה: node scripts/generate-seo-assets.mjs
 */
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

await mkdir(path.join(root, "public"), { recursive: true });

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#141418"/>
      <stop offset="100%" style="stop-color:#1e1e24"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect x="0" y="0" width="1200" height="6" fill="#c9a227"/>
  <text x="600" y="280" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="72" font-weight="700" fill="#f5e6b8">JACUZZI</text>
  <text x="600" y="360" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="34" fill="#e8e8ec">Dog grooming · Jerusalem</text>
</svg>`;

await sharp(Buffer.from(ogSvg))
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(path.join(root, "public", "og-image.jpg"));

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#141418"/>
  <text x="16" y="22" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="16" font-weight="700" fill="#c9a227">J</text>
</svg>`;

await sharp(Buffer.from(iconSvg)).png().toFile(path.join(root, "app", "icon.png"));

console.log("Wrote public/og-image.jpg and app/icon.png");
