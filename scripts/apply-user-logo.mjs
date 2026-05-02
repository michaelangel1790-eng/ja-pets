/**
 * מעתיק את לוגו המקור שלך ל־logo-main-top.png עם שיפור תצוגה בלבד:
 * - אם הרוחב קטן מ־720px — הגדלה פרופורציונלית (Lanczos3) לחדות על מסכים גדולים
 * - חידוד קל (מפחית תחושת “טשטוש קומפרסיה”)
 *
 * לא מבצע שינוי צבעים, פילטרים אגרסיביים או snap לפיקסלים.
 *
 * אופציונלי:
 *   LOGO_TRIM=1 / LOGO_CROP_PX=N — כמו קודם
 *   LOGO_TARGET_WIDTH=720 — רוחב יעד להגדלה (0 = בלי הגדלה)
 *   LOGO_SHARPEN=0 — לכבות חידוד עדין
 */
import sharp from "sharp";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outPath = join(root, "public/images/logo-main-top.png");

function defaultSourcePath() {
  const local = join(root, "public/images/logo-main-top-user-source.png");
  if (!existsSync(local)) {
    console.error(
      [
        "חסר הקובץ public/images/logo-main-top-user-source.png",
        "העתק אליו את קובץ הלוגו המקורי (PNG), ואז:",
        "  npm run refine:logo",
        "",
        "או:",
        '  USER_LOGO_SRC="C:\\path\\to\\logo.png" npm run refine:logo',
      ].join("\n"),
    );
    process.exit(1);
  }
  return local;
}

async function main() {
  const srcPath = process.env.USER_LOGO_SRC || defaultSourcePath();
  if (!existsSync(srcPath)) {
    console.error("לא נמצא קובץ מקור:", srcPath);
    process.exit(1);
  }

  let pipeline = sharp(srcPath).ensureAlpha();

  if (process.env.LOGO_TRIM === "1") {
    pipeline = pipeline.trim({
      threshold: Number(process.env.LOGO_TRIM_THRESHOLD || 24),
    });
  }

  const cropPx = Number(process.env.LOGO_CROP_PX || 0);
  if (cropPx > 0) {
    const meta = await pipeline.metadata();
    const w = (meta.width ?? 0) - cropPx * 2;
    const h = (meta.height ?? 0) - cropPx * 2;
    if (w < 8 || h < 8) {
      throw new Error("LOGO_CROP_PX גדול מדי ביחס לגודל התמונה");
    }
    pipeline = pipeline.extract({
      left: cropPx,
      top: cropPx,
      width: w,
      height: h,
    });
  }

  const meta = await pipeline.metadata();
  const w0 = meta.width ?? 0;
  const h0 = meta.height ?? 0;
  const targetW = Number(process.env.LOGO_TARGET_WIDTH ?? "720");

  if (targetW > 0 && w0 > 0 && w0 < targetW) {
    const nh = Math.max(1, Math.round(h0 * (targetW / w0)));
    pipeline = pipeline.resize(targetW, nh, {
      kernel: sharp.kernel.lanczos3,
      fit: "fill",
    });
  }

  if (process.env.LOGO_SHARPEN !== "0") {
    pipeline = pipeline.sharpen({
      sigma: 0.55,
      m1: 0.8,
      m2: 3,
    });
  }

  await pipeline.png({ compressionLevel: 9, effort: 10 }).toFile(outPath);

  const outMeta = await sharp(outPath).metadata();
  console.log(
    JSON.stringify(
      {
        src: srcPath,
        out: "public/images/logo-main-top.png",
        width: outMeta.width,
        height: outMeta.height,
        upscaledToWidth: targetW > 0 && w0 > 0 && w0 < targetW ? targetW : null,
        sharpen: process.env.LOGO_SHARPEN !== "0",
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
