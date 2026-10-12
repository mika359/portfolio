// Builds the two "resting" poses of the lion (public/lion/sit-0.png, sit-1.png) from the photo of a
// lion lying on its side (lion-source/lying.png):
//   sit-0: lying body + mane/head in profile (taken from the first walking frame)
//   sit-1: same body + head turned to face the viewer (lion-source/head-front.png)
// The body keeps the anatomy of the photo but gets the same look as the walking frames:
// dark interior with a modelled glow, bright outline, fur contours and sparkles.
// Both heads get extra procedural mane strands so the mane reads as hair.
// Run via `npm run lion:build` (after build-lion.mjs).
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

const W = 520;
const H = 340;
const OUT = "public/lion";
const GROUND = 334;

// ---- helpers -------------------------------------------------------------------------------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261013);
const clamp = (v, a = 0, b = 255) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const raw1 = (buf, w = W, h = H) => ({ raw: { width: w, height: h, channels: 1 } });

async function blur(buf, sigma, w = W, h = H) {
  // sharp may return 3 channels for a blurred 1-channel buffer, so always pull out a single one.
  const out = await sharp(buf, raw1(buf, w, h)).blur(sigma).extractChannel(0).raw().toBuffer();
  if (out.length !== w * h) throw new Error(`blur: expected ${w * h} bytes, got ${out.length}`);
  return out;
}
async function renderSvg(svg) {
  const { data } = await sharp(Buffer.from(svg)).resize(W, H).greyscale().raw().toBuffer({ resolveWithObject: true });
  return data;
}
function distanceInside(mask) {
  const d = new Float32Array(W * H);
  for (let i = 0; i < d.length; i++) d[i] = mask[i] > 127 ? 1e6 : 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!d[i]) continue;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 1);
      if (y > 0) v = Math.min(v, d[i - W] + 1);
      if (x > 0 && y > 0) v = Math.min(v, d[i - W - 1] + 1.4);
      if (x < W - 1 && y > 0) v = Math.min(v, d[i - W + 1] + 1.4);
      d[i] = v;
    }
  for (let y = H - 1; y >= 0; y--)
    for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x;
      if (!d[i]) continue;
      let v = d[i];
      if (x < W - 1) v = Math.min(v, d[i + 1] + 1);
      if (y < H - 1) v = Math.min(v, d[i + W] + 1);
      if (x < W - 1 && y < H - 1) v = Math.min(v, d[i + W + 1] + 1.4);
      if (x > 0 && y < H - 1) v = Math.min(v, d[i + W - 1] + 1.4);
      d[i] = v;
    }
  return d;
}

// ---- 1. place the lying lion in the 520x340 canvas ---------------------------------------------
// In the photo the lion spans x 85..880 (tail tip .. paw tip) and its paws rest at y 588.
const SC = 505 / (880 - 85);
const phW = 968;
const phH = 606;
const { data: photo } = await sharp("lion-source/lying.png").removeAlpha().raw().toBuffer({ resolveWithObject: true });
const rw = Math.round(phW * SC);
const rh = Math.round(phH * SC);
const small = await sharp(photo, { raw: { width: phW, height: phH, channels: 3 } }).resize(rw, rh, { kernel: "lanczos3" }).raw().toBuffer();
const ox = Math.round(8 - 85 * SC);
const oy = Math.round(GROUND - 588 * SC);
const rgb = Buffer.alloc(W * H * 3, 240);
for (let y = 0; y < rh; y++)
  for (let x = 0; x < rw; x++) {
    const tx = x + ox;
    const ty = y + oy;
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
    for (let c = 0; c < 3; c++) rgb[(ty * W + tx) * 3 + c] = small[(y * rw + x) * 3 + c];
  }

// ---- 2. segment the lion from the pale background ----------------------------------------------
const lum = Buffer.alloc(W * H);
const mask0 = Buffer.alloc(W * H);
for (let i = 0; i < W * H; i++) {
  const r = rgb[i * 3];
  const g = rgb[i * 3 + 1];
  const b = rgb[i * 3 + 2];
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  lum[i] = clamp(l);
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  mask0[i] = sat > 22 || l < 172 ? 255 : 0;
}
// Close small holes (white chin, highlights): dilate then erode.
let m = await blur(mask0, 2.2);
m = Buffer.from(m.map((v) => (v > 70 ? 255 : 0)));
m = await blur(m, 2.2);
const mask = Buffer.from(m.map((v) => (v > 175 ? 255 : 0)));
// Never let anything below the ground line in.
for (let y = GROUND + 1; y < H; y++) for (let x = 0; x < W; x++) mask[y * W + x] = 0;

// ---- 2b. a clearly visible tail on the left ------------------------------------------------------
// The photo's tail is a thin line, so it is replaced by a drawn one: it curls up at the tip and ends in a tuft.
const TAIL_PATH = "M112,309 C88,321 58,328 36,322 C18,316 12,298 22,284";
const TUFT = { x: 22, y: 276 };
for (let y = 0; y < H; y++) for (let x = 0; x < 104; x++) mask[y * W + x] = 0;
const tailMask = await renderSvg(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="black"/>` +
    `<path d="${TAIL_PATH}" fill="none" stroke="white" stroke-width="11" stroke-linecap="round"/>` +
    `<ellipse cx="${TUFT.x}" cy="${TUFT.y}" rx="12" ry="19" transform="rotate(-14 ${TUFT.x} ${TUFT.y})" fill="white"/></svg>`,
);
for (let i = 0; i < mask.length; i++) if (tailMask[i] > 127) mask[i] = 255;
// Tuft hair: short bright strands fanning out of the tip, plus a few along the tail.
const tailHair = await renderSvg(
  (() => {
    let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="black"/>`;
    for (let i = 0; i < 70; i++) {
      const a = -Math.PI / 2 - 0.25 + (rand() - 0.5) * 2.4;
      const r0 = 5 + rand() * 7;
      const r1 = 16 + rand() * 14;
      const x0 = TUFT.x + Math.cos(a) * r0;
      const y0 = TUFT.y + Math.sin(a) * r0 * 1.4;
      const x1 = TUFT.x + Math.cos(a) * r1 + (rand() - 0.5) * 6;
      const y1 = TUFT.y + Math.sin(a) * r1 * 1.4;
      s += `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)}" stroke="white" stroke-opacity="${(0.35 + 0.55 * rand()).toFixed(2)}" stroke-width="${(0.7 + rand() * 0.7).toFixed(2)}" stroke-linecap="round"/>`;
    }
    for (let i = 0; i < 26; i++) {
      const t = rand();
      const px = 112 - t * 80;
      const py = 309 + Math.sin(t * 2.4) * 8;
      s += `<path d="M${px.toFixed(1)},${py.toFixed(1)} l${(-3 - rand() * 4).toFixed(1)},${(3 + rand() * 4).toFixed(1)}" stroke="white" stroke-opacity="0.5" stroke-width="0.8"/>`;
    }
    return s + "</svg>";
  })(),
);

// ---- 3. restyle the body ------------------------------------------------------------------------
const dist = distanceInside(mask);

const lumN = await sharp(lum, raw1(lum)).clahe({ width: 12, height: 8, maxSlope: 3 }).extractChannel(0).raw().toBuffer();
if (lumN.length !== W * H) throw new Error("clahe: unexpected buffer size");
const lumSm = await blur(lum, 1);
const rim = Buffer.alloc(W * H);
const contour = Buffer.alloc(W * H);
for (let y = 1; y < H - 1; y++)
  for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    const d = dist[i];
    if (!d) continue;
    // Fainter along the ground so the belly does not read as a thick floor line.
    const ground = y > GROUND - 9 ? 0.12 : 1;
    rim[i] = clamp((d <= 1.6 ? 255 : d <= 3 ? 170 : d <= 4.5 ? 80 : d <= 6 ? 28 : 0) * (0.72 + 0.28 * rand()) * ground);
    const gx = lumSm[i + 1] - lumSm[i - 1] + (lumSm[i + W + 1] - lumSm[i + W - 1]) * 0.5 + (lumSm[i - W + 1] - lumSm[i - W - 1]) * 0.5;
    const gy = lumSm[i + W] - lumSm[i - W] + (lumSm[i + W + 1] - lumSm[i - W + 1]) * 0.5 + (lumSm[i + W - 1] - lumSm[i - W - 1]) * 0.5;
    const g = Math.hypot(gx, gy);
    if (d > 4) contour[i] = clamp((g - 14) * 5.5);
  }
const rimBlur = await blur(rim, 1.1);
const contourBlur = await blur(contour, 0.7);

const sparkle = Buffer.alloc(W * H);
function dot(buf, x, y, r, v) {
  for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++)
    for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
      const px = Math.round(x) + dx;
      const py = Math.round(y) + dy;
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      const f = 1 - Math.hypot(dx, dy) / (r + 0.6);
      if (f > 0) buf[py * W + px] = clamp(Math.max(buf[py * W + px], v * f));
    }
}
for (let n = 0, placed = 0; n < 40000 && placed < 230; n++) {
  const x = rand() * W;
  const y = rand() * H;
  const i = Math.round(y) * W + Math.round(x);
  // sparkles prefer lit areas of the body
  if (mask[i] > 127 && dist[i] > 3 && rand() < 0.25 + lumN[i] / 330) {
    dot(sparkle, x, y, 0.7 + rand() * 1.2, 150 + rand() * 105);
    placed++;
  }
}
// dust stream drifting up and to the left of the body
for (let n = 0; n < 200; n++) {
  const t = rand();
  const x = 250 - t * 235 + (rand() - 0.5) * 70;
  const y = 120 + t * 90 + (rand() - 0.5) * 100 - Math.sin(t * 5) * 18;
  if (x > 4 && y > 4 && mask[Math.round(y) * W + Math.round(x)] < 128) dot(sparkle, x, y, 0.6 + rand(), 90 + rand() * 150);
}

const body = Buffer.alloc(W * H);
for (let i = 0; i < body.length; i++) {
  const fill = mask[i] > 127 ? 6 + lumN[i] * 0.07 + rand() * 10 : 0;
  body[i] = clamp(fill + rimBlur[i] * 1.1 + contourBlur[i] * 0.55 + sparkle[i] + tailHair[i] * 0.95);
}

// ---- 4. heads ------------------------------------------------------------------------------------
const HC = { x: 344, y: 212 }; // head centre on the canvas
const eraser = (buf, rx, ry) => {
  const out = Buffer.from(buf);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const e = Math.hypot((x - HC.x) / rx, (y - HC.y) / ry);
      const k = smooth(0.82, 1.0, e);
      if (k < 1) out[y * W + x] = clamp(buf[y * W + x] * k);
    }
  return out;
};
const bodyNoHead = eraser(body, 62, 66);

// Mane strands (procedural hair) so both heads read as hairy.
function strandsSvg(R, mode, n) {
  let paths = "";
  for (let i = 0; i < n; i++) {
    const a = rand() * Math.PI * 2;
    const r0 = R * (0.72 + 0.25 * rand());
    const r1 = R * (0.92 + 0.3 * rand() ** 1.6);
    const x0 = HC.x + Math.cos(a) * r0;
    const y0 = HC.y + Math.sin(a) * r0 * 1.05;
    // Hair flows with the "wind": backwards for the profile head, down and outwards for the front head.
    let x1 = HC.x + Math.cos(a) * r1;
    let y1 = HC.y + Math.sin(a) * r1 * 1.05;
    if (mode === "profile") x1 -= R * 0.3 * rand();
    else if (mode === "profileL") x1 += R * 0.3 * rand();
    else y1 += R * 0.22 * (0.4 + Math.max(0, Math.sin(a))) * rand();
    const mx = (x0 + x1) / 2 + (rand() - 0.5) * R * 0.5 + (mode === "profile" ? -R * 0.1 : mode === "profileL" ? R * 0.1 : 0);
    const my = (y0 + y1) / 2 + (rand() - 0.5) * R * 0.5 + (mode === "front" ? R * 0.08 : 0);
    paths += `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}" stroke="white" stroke-opacity="${(0.08 + 0.18 * rand()).toFixed(2)}" stroke-width="${(0.6 + rand() * 0.7).toFixed(2)}" fill="none" stroke-linecap="round"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="black"/>${paths}</svg>`;
}

// Profile head: the first walking frame's mane and face, scaled down and mirrored into place.
const walk = await sharp(`${OUT}/frame-0.png`).greyscale().extractChannel(0).raw().toBuffer();
if (walk.length !== W * H) throw new Error("walk frame: unexpected buffer size");
const profile = Buffer.from(bodyNoHead);
{
  const k = 0.7; // scale of the walking-frame head
  const sx0 = 412; // head centre in the walking frame
  const sy0 = 152;
  const rx = 124 * k;
  const ry = 106 * k;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const e = Math.hypot((x - HC.x) / rx, (y - HC.y) / ry);
      const a = 1 - smooth(0.7, 1, e);
      if (a <= 0) continue;
      const wx = Math.round(sx0 + (x - HC.x) / k);
      const wy = Math.round(sy0 + (y - HC.y) / k);
      if (wx < 0 || wy < 0 || wx >= W || wy >= H) continue;
      const i = y * W + x;
      profile[i] = clamp(bodyNoHead[i] * (1 - a) + Math.min(255, walk[wy * W + wx] * 1.15) * a);
    }
}
const profStrands = await renderSvg(strandsSvg(70, "profile", 300));
for (let i = 0; i < profile.length; i++) profile[i] = clamp(Math.max(profile[i], profStrands[i] * 0.9));

// Front head: segment the lion from the sky by colour, stretch contrast, keep most of the mane.
const { data: prgb, info } = await sharp("lion-source/head-front.png").removeAlpha().raw().toBuffer({ resolveWithObject: true });
const pw = info.width;
const ph = info.height;
const gray = Buffer.alloc(pw * ph);
const keep = Buffer.alloc(pw * ph);
for (let i = 0; i < pw * ph; i++) {
  const r = prgb[i * 3];
  const g = prgb[i * 3 + 1];
  const b = prgb[i * 3 + 2];
  const l = 0.3 * r + 0.59 * g + 0.11 * b;
  gray[i] = clamp(l);
  const isSky = b > r - 6 && l > 115;
  const isGreen = g > r - 3 && l > 85;
  keep[i] = !isSky && ((r > b + 22 && !isGreen) || l < 85) ? 255 : 0;
}
const keepSoft = await blur(keep, 3, pw, ph);
const toned = Buffer.alloc(pw * ph);
for (let y = 0; y < ph; y++)
  for (let x = 0; x < pw; x++) {
    const i = y * pw + x;
    const ex = Math.hypot((x - pw * 0.5) / (pw * (x < pw * 0.5 ? 0.41 : 0.48)), (y - ph * 0.5) / (ph * 0.56));
    const frame = 1 - smooth(0.66, 0.98, ex);
    const bottom = 1 - smooth(0.78, 1, y / ph);
    const v = clamp(((gray[i] - 52) / 140) ** 1.2 * 255 * 1.12);
    toned[i] = clamp(v * (keepSoft[i] / 255) * frame * bottom);
  }
const FS = 0.27; // front head scale (mane about as wide as the profile mane, in proportion to the body)
const hw = Math.round(pw * FS);
const hh = Math.round(ph * FS);
const { data: headSmall, info: hinfo } = await sharp(toned, raw1(toned, pw, ph))
  .resize(hw, hh, { kernel: "lanczos3" })
  .clahe({ width: 12, height: 12, maxSlope: 4 })
  .sharpen({ sigma: 1.0, m1: 1.5, m2: 2.5 })
  .toColourspace("b-w")
  .raw()
  .toBuffer({ resolveWithObject: true });
if (hinfo.channels !== 1) throw new Error(`expected 1 channel, got ${hinfo.channels}`);
const front = Buffer.from(bodyNoHead);
{
  const hx = Math.round(HC.x - hw / 2);
  const hy = Math.round(HC.y - hh / 2) + 4;
  for (let y = 0; y < hh; y++)
    for (let x = 0; x < hw; x++) {
      const tx = x + hx;
      const ty = y + hy;
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
      const h = headSmall[y * hw + x];
      const a = smooth(4, 50, h);
      const i = ty * W + tx;
      front[i] = clamp(front[i] * (1 - a) + h * a);
    }
}
// Crown fill: the photo's top-centre of the mane is near black and leaves a hole above the forehead.
// Fill it with fur-like streaks that fan out from the forehead, fading into the surrounding mane.
{
  const cx = HC.x + 3;
  const cy = HC.y - 46;
  const px = cx; // hair radiates from the parting above the forehead
  const py = cy + 30;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const e = Math.hypot((x - cx) / 30, (y - cy) / 26);
      if (e >= 1) continue;
      const a = 1 - smooth(0.45, 1, e);
      const ang = Math.atan2(y - py, x - px);
      const r = Math.hypot(x - px, y - py);
      // Wide tonal range (dark gaps, mid tones, bright highlights) like the rest of the mane.
      const streak = 0.5 + 0.5 * Math.sin(ang * 46 + 2.4 * Math.sin(r * 0.17) + 1.7 * Math.sin(ang * 13));
      const s = Math.min(1, streak * (0.45 + 0.8 * rand()));
      const fur = 14 + 236 * s ** 1.5;
      const i = y * W + x;
      front[i] = clamp(Math.max(front[i], fur * a));
    }
}
const frontStrands = await renderSvg(strandsSvg(76, "front", 260));
for (let i = 0; i < front.length; i++) front[i] = clamp(Math.max(front[i], frontStrands[i] * 0.9));

// Yawn / roar pose: the lower jaw drops, the mouth interior is dark and the fangs show.
const front2 = Buffer.from(front);
{
  const hx = Math.round(HC.x - hw / 2);
  const hy = Math.round(HC.y - hh / 2) + 4;
  const MX = hx + 313 * FS; // mouth centre (photo coordinates -> canvas)
  const MY = hy + 430 * FS;
  const GAP = 13;
  const gapAt = (x) => GAP * (1 - smooth(10, 27, Math.abs(x - MX)));
  for (let y = Math.floor(MY); y < Math.floor(MY) + 48; y++)
    for (let x = Math.floor(MX) - 34; x <= Math.floor(MX) + 34; x++) {
      const gap = gapAt(x);
      if (gap <= 0.3) continue;
      const i = y * W + x;
      if (y < MY + gap) {
        front2[i] = clamp(4 + rand() * 12); // inside of the mouth
      } else {
        const fall = 1 - smooth(MY + 10, MY + 44, y);
        const sy = Math.round(y - gap * fall);
        front2[i] = front[sy * W + x];
      }
    }
  // tongue: a dim shape resting on the lower jaw
  for (let y = Math.floor(MY); y < MY + GAP + 2; y++)
    for (let x = Math.floor(MX) - 12; x <= MX + 12; x++) {
      const e = Math.hypot((x - MX) / 11, (y - (MY + GAP * 0.72)) / 4);
      if (e < 1 && y < MY + gapAt(x)) front2[y * W + x] = clamp(front2[y * W + x] + 42 * (1 - e));
    }
  // fangs
  const fang = (fx, y0, dir, h) => {
    for (let d = 0; d < h; d++) {
      const half = 1.1 * (1 - d / h) + 0.4;
      for (let x = Math.round(fx - half); x <= Math.round(fx + half); x++) front2[Math.round(y0 + dir * d) * W + x] = 240;
    }
  };
  for (const s of [-1, 1]) {
    fang(MX + s * 10, MY + 1, 1, 7); // upper canines
    fang(MX + s * 8, MY + gapAt(MX + s * 8) - 1, -1, 5); // lower canines
  }
}

// Head turned to the left (mirror of the profile head): used when the mouse is on the left of the lion.
const profileL = Buffer.from(bodyNoHead);
{
  const k = 0.7;
  const sx0 = 412;
  const sy0 = 152;
  const rx = 124 * k;
  const ry = 106 * k;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const e = Math.hypot((x - HC.x) / rx, (y - HC.y) / ry);
      const a = 1 - smooth(0.7, 1, e);
      if (a <= 0) continue;
      const wx = Math.round(sx0 - (x - HC.x) / k);
      const wy = Math.round(sy0 + (y - HC.y) / k);
      if (wx < 0 || wy < 0 || wx >= W || wy >= H) continue;
      const i = y * W + x;
      profileL[i] = clamp(bodyNoHead[i] * (1 - a) + Math.min(255, walk[wy * W + wx] * 1.15) * a);
    }
}
const profStrandsL = await renderSvg(strandsSvg(70, "profileL", 300));
for (let i = 0; i < profileL.length; i++) profileL[i] = clamp(Math.max(profileL[i], profStrandsL[i] * 0.9));

// Darken the mid-tones so features (eyes, nose, mouth) stand out once turned into characters.
const darken = (buf) => Buffer.from(buf.map((v) => clamp(255 * (v / 255) ** 1.12 * 1.04)));
async function save(buf0, name) {
  const buf = darken(buf0);
  await sharp(buf, raw1(buf)).png({ compressionLevel: 9 }).toFile(`${OUT}/${name}`);
}
await save(profile, "sit-0.png");
await save(front, "sit-1.png");
await save(front2, "sit-2.png");
await save(profileL, "sit-3.png");

const manifest = JSON.parse(await readFile(`${OUT}/manifest.json`, "utf8"));
manifest.sit = 4;
await writeFile(`${OUT}/manifest.json`, JSON.stringify(manifest));
console.log("Wrote sit-0.png (lying, head in profile) and sit-1.png (lying, looking at the viewer)");
