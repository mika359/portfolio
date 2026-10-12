// Converts the reference lion frames in `lion-source/` into small, aligned grayscale maps
// (public/lion/frame-N.png + manifest.json). The site turns those brightness maps into
// 0/1/symbol characters at runtime. Add more frames (frame-4.png, ...) and run `npm run lion:build`.
import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SRC = "lion-source";
const OUT = "public/lion";
const SCALE = 0.27; // same scale for every frame (they share the same pixel size)
const OW = 520; // output width
const OH = 340; // output height
const PAD = 6;

const files = (await readdir(SRC))
  .filter((f) => /^frame-\d+\.(png|jpe?g|webp)$/i.test(f))
  .sort((a, b) => parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]));
if (!files.length) throw new Error(`No frames found in ${SRC}/`);

const frames = [];
for (const f of files) {
  const { data, info } = await sharp(path.join(SRC, f))
    .greyscale()
    .resize({ width: Math.round((await sharp(path.join(SRC, f)).metadata()).width * SCALE) })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;

  // Lion body bounds: rightmost column (nose/mane) and lowest row (paws), ignoring stray dust.
  const T = 90;
  const MIN = 5;
  let right = 0;
  for (let x = w - 1; x > 0 && !right; x--) {
    let n = 0;
    for (let y = Math.round(h * 0.18); y < Math.round(h * 0.95); y++) if (data[y * w + x] > T) n++;
    if (n >= MIN) right = x;
  }
  let bottom = 0;
  for (let y = h - 1; y > 0 && !bottom; y--) {
    let n = 0;
    for (let x = Math.round(w * 0.2); x < Math.round(w * 0.9); x++) if (data[y * w + x] > T) n++;
    if (n >= MIN) bottom = y;
  }
  frames.push({ f, data, w, h, right, bottom });
  console.log(f, `${w}x${h}`, "right", right, "bottom", bottom);
}

await mkdir(OUT, { recursive: true });
for (let i = 0; i < frames.length; i++) {
  const { data, w, h, right, bottom } = frames[i];
  // Place so that the nose edge and the paws land on the same output pixels in every frame.
  const ox = OW - PAD - right;
  const oy = OH - PAD - bottom;
  const out = Buffer.alloc(OW * OH, 0);
  for (let y = 0; y < h; y++) {
    const ty = y + oy;
    if (ty < 0 || ty >= OH) continue;
    for (let x = 0; x < w; x++) {
      const tx = x + ox;
      if (tx < 0 || tx >= OW) continue;
      out[ty * OW + tx] = data[y * w + x];
    }
  }
  await sharp(out, { raw: { width: OW, height: OH, channels: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, `frame-${i}.png`));
}
await writeFile(path.join(OUT, "manifest.json"), JSON.stringify({ frames: frames.length, width: OW, height: OH }));
console.log(`Wrote ${frames.length} frames to ${OUT}/`);
