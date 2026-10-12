// Builds public/me.jpg from the original portrait in photo-source/m_portfolio.jpg:
//   - 4:5 crop (head and crossed arms), 960x1200
//   - ear / skin redness pulled to the face tone (backlit ears glowed red)
//   - red tie darkened to a calmer crimson
//   - green-yellow background cooled and darkened so it sits on the dark theme
//   - slight cool grade and vignette
// Run: node scripts/build-photo.mjs
import sharp from "sharp";

const SRC = "photo-source/m_portfolio.jpg";
const OUT = "public/me.jpg";
const W = 960;
const H = 1200;
// Crop in original pixels (4480x6720): about display (130..1260, 250..1663) of the 1333px preview, x3.36.
const CROP = { left: 437, top: 840, width: 3797, height: 4747 };

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;
const lerpHue = (a, b, t) => (a + ((((b - a) % 360) + 540) % 360 - 180) * t + 360) % 360;
const ell = (x, y, cx, cy, rx, ry) => Math.hypot((x - cx) / rx, (y - cy) / ry);

function rgb2hsv(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d > 0) {
    if (mx === r) h = ((g - b) / d + 6) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, mx ? d / mx : 0, mx];
}
function hsv2rgb(h, s, v) {
  const c = v * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = v - c;
  return [r + m, g + m, b + m];
}
const hueDist = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

const { data, info } = await sharp(SRC)
  .rotate()
  .extract(CROP)
  .resize(W, H, { kernel: "lanczos3" })
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
if (info.width !== W || info.height !== H || info.channels !== 3) throw new Error("unexpected size");

// Face reference tone: median hue / saturation of a cheek patch (crop pixels).
const sample = [];
for (let y = 330; y < 400; y++) for (let x = 360; x < 430; x++) sample.push(rgb2hsv(data[(y * W + x) * 3] / 255, data[(y * W + x) * 3 + 1] / 255, data[(y * W + x) * 3 + 2] / 255));
const med = (i) => sample.map((p) => p[i]).sort((a, b) => a - b)[sample.length >> 1];
const SKIN = { h: med(0), s: med(1), v: med(2) };
console.log("face reference h/s/v", SKIN.h.toFixed(1), SKIN.s.toFixed(2), SKIN.v.toFixed(2));

// Regions in crop pixels.
const EARS = [
  { x: 310, y: 335, rx: 58, ry: 90 },
  { x: 610, y: 300, rx: 58, ry: 90 },
];
const HEAD = { x: 450, y: 300, rx: 300, ry: 240 };
const TIE = { x0: 395, x1: 540, y0: 545, y1: 830 };

const out = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    let [h, s, v] = rgb2hsv(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);

    const redHue = hueDist(h, 8) < 38; // red to orange
    const red = redHue ? smooth(0.32, 0.7, s) : 0;

    // Ears and general head redness -> face tone.
    let earW = 0;
    for (const e of EARS) earW = Math.max(earW, 1 - smooth(0.75, 1.15, ell(x, y, e.x, e.y, e.rx, e.ry)));
    const headW = 0.3 * (1 - smooth(0.8, 1.05, ell(x, y, HEAD.x, HEAD.y, HEAD.rx, HEAD.ry)));
    const w = Math.max(earW, headW) * red;
    if (w > 0) {
      h = lerpHue(h, SKIN.h, 0.8 * w);
      s = lerp(s, Math.min(s, SKIN.s * 1.05), 0.92 * w);
      v = v * (1 - 0.1 * w);
    }

    // Tie: calmer crimson.
    const tieBox = smooth(TIE.x0 - 12, TIE.x0 + 8, x) * (1 - smooth(TIE.x1 - 8, TIE.x1 + 12, x)) * smooth(TIE.y0 - 12, TIE.y0 + 8, y) * (1 - smooth(TIE.y1 - 8, TIE.y1 + 12, y));
    const tieW = tieBox * (hueDist(h, 355) < 25 ? smooth(0.55, 0.8, s) : 0);
    if (tieW > 0) {
      s = lerp(s, s * 0.78, tieW);
      v = lerp(v, v * 0.6, tieW);
    }

    // Background greens / yellows -> dark teal.
    const green = smooth(48, 75, h) * (1 - smooth(165, 195, h)) * smooth(0.12, 0.3, s);
    if (green > 0) {
      h = lerpHue(h, 192, 0.55 * green);
      s = lerp(s, s * 0.55, green);
      v = lerp(v, v * 0.7, green);
    }

    let [r, g, b] = hsv2rgb(h, clamp(s), clamp(v));

    // Cool grade and vignette.
    r *= 0.985;
    b = Math.min(1, b * 1.04);
    const vig = 1 - 0.16 * smooth(0.55, 1.25, ell(x, y, W / 2, H * 0.45, W * 0.62, H * 0.62));
    out[i] = clamp(r * vig) * 255;
    out[i + 1] = clamp(g * vig) * 255;
    out[i + 2] = clamp(b * vig) * 255;
  }
}

await sharp(out, { raw: { width: W, height: H, channels: 3 } })
  .modulate({ saturation: 0.97 })
  .sharpen({ sigma: 0.8, m1: 0.6, m2: 1.2 })
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(OUT);
console.log("wrote", OUT);
