/**
 * Removes background by flood-filling from image edges — preserves text/logo that
 * is not connected to the outer background (e.g. white lettering on black wrap).
 *
 * Usage: node scripts/extract-truck-transparent.js <input> <output-nobg.png> [--tol=N]
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const input = process.argv[2];
const output = process.argv[3];
const tolArg = process.argv.find((a) => a.startsWith("--tol="));
const TOL = tolArg ? Number.parseInt(tolArg.split("=")[1], 10) : 38;

if (!input || !output) {
  console.error("Usage: node scripts/extract-truck-transparent.js <input> <output-nobg.png> [--tol=38]");
  process.exit(1);
}

if (!fs.existsSync(input)) {
  console.error("Input not found:", input);
  process.exit(1);
}

function idxAt(width, x, y) {
  return (y * width + x) * 4;
}

(async () => {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const pixels = Buffer.from(data);

  /** @type {{r:number,g:number,b:number}[]} */
  const edgeSamples = [];
  for (let x = 0; x < width; x++) {
    for (const y of [0, height - 1]) {
      const i = idxAt(width, x, y);
      edgeSamples.push({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
    }
  }
  for (let y = 1; y < height - 1; y++) {
    for (const x of [0, width - 1]) {
      const i = idxAt(width, x, y);
      edgeSamples.push({ r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] });
    }
  }

  let sr = 0,
    sg = 0,
    sb = 0;
  for (const p of edgeSamples) {
    sr += p.r;
    sg += p.g;
    sb += p.b;
  }
  sr /= edgeSamples.length;
  sg /= edgeSamples.length;
  sb /= edgeSamples.length;

  function matchBg(r, g, b) {
    const dr = r - sr;
    const dg = g - sg;
    const db = b - sb;
    return Math.sqrt(dr * dr + dg * dg + db * db) <= TOL;
  }

  const w = width;
  const h = height;
  const removed = new Uint8Array(w * h);
  /** @type [number, number][] */
  const queue = [];

  function trySeed(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const p = y * w + x;
    if (removed[p]) return;
    const i = idxAt(w, x, y);
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (matchBg(r, g, b)) {
      removed[p] = 1;
      queue.push(x, y);
    }
  }

  for (let x = 0; x < w; x++) {
    trySeed(x, 0);
    trySeed(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    trySeed(0, y);
    trySeed(w - 1, y);
  }

  let qi = 0;
  while (qi < queue.length) {
    const x = queue[qi++];
    const y = queue[qi++];
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const np = ny * w + nx;
      if (removed[np]) continue;
      const i = idxAt(w, nx, ny);
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      if (matchBg(r, g, b)) {
        removed[np] = 1;
        queue.push(nx, ny);
      }
    }
  }

  for (let p = 0; p < w * h; p++) {
    if (!removed[p]) continue;
    const i = p * 4;
    pixels[i + 3] = 0;
  }

  await sharp(pixels, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(output);

  let meta = await sharp(output).metadata();
  const trimmed = await sharp(output).trim({ threshold: 5 }).png({ compressionLevel: 9 }).toBuffer();
  await fs.promises.writeFile(output, trimmed);
  meta = await sharp(output).metadata();

  const flatPath = path.join(path.dirname(output), "truck-location.png");
  const nobgBuf = await fs.promises.readFile(output);
  await sharp({
    create: {
      width: meta.width,
      height: meta.height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: nobgBuf, left: 0, top: 0 }])
    .png({ compressionLevel: 9 })
    .toFile(flatPath);
  const flatMeta = await sharp(flatPath).metadata();

  console.log("Bg RGB (~)", Math.round(sr), Math.round(sg), Math.round(sb), "tol", TOL);
  console.log("Wrote", output, `${meta.width}x${meta.height}`, meta.format);
  console.log("Wrote", flatPath, `${flatMeta.width}x${flatMeta.height}`, flatMeta.format);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
