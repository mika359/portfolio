"use client";

import { useEffect, useRef } from "react";
import { useTheme, type Theme } from "@/lib/theme";
import { getLionMode, type LionMode } from "@/lib/lionMode";

/**
 * Male lion made of 0s, 1s and symbols.
 *
 * Poses are brightness maps (public/lion/*.png, built by `npm run lion:build`). Each map is
 * resampled to the character grid and every cell becomes a glyph picked by brightness: dark cells
 * are dots, mid tones are digits, highlights are heavy symbols. Poses dissolve into each other
 * cell by cell, like particles re-forming.
 *
 * The requested behaviour comes from src/lib/lionMode.ts (sit | walk):
 *  - sit (default): the lion lies at its resting place, follows the mouse with its head (turning from
 *                   profile-left through frontal to profile-right) and yawns when idle.
 *  - walk:          it gets up and walks from left to right across the hero in a loop.
 * Internal phases: walk, approach (walks to the resting place), settle (lies down), sit, rise (gets up).
 */

// Glyph candidates per brightness level, lightest first. Digits carry the mid tones.
const RAMP = [".'`", ":;,", "1li!", "01", "70/", "{}<>+", "=*?%", "#$&", "@8WM"];
const SPARK_GLYPHS = "01+*{}<>/;·";
const STEP_SECONDS = 0.7; // time between two walking poses (paws keep up with the ground speed)
const CROSS_SECONDS = 24; // time to cross the screen: a calm walk, also used when heading to the resting place
const SIT_ZOOM = 1.3; // enlargement of the lying pose
const HEAD = { x: 344, y: 212, rx: 82, ry: 88 }; // head of the lying pose, in map pixels (for the idle motion)
const FACE = { x: 349, y: 230, rx: 30, ry: 42 }; // eyes, nose and mouth only: the part that follows the mouse
const TURN_X = 4.5; // largest sideways shift of the whole head (mane and face) while following the mouse, in grid cells
const TURN_Y = 3; // largest vertical shift of the head, in grid cells
const GAZE_X = 3; // extra shift of the face only (eyes, nose, mouth), so the face turns a bit more than the mane
const GAZE_Y = 2;
const FOLLOW_RANGE = 0.3; // mouse distance (fraction of the hero width) at which the head is fully turned
const V_MIN = 0.11; // below this a cell stays empty, so the dark body reads as a void with a glowing outline

const PALETTE: Record<Theme, [string, string, string, string]> = {
  // dim, mid, bright, spark
  dark: ["#2a7cc0", "#3db4ff", "#b6edff", "#ffffff"],
  light: ["#a9cdea", "#3c86c8", "#0f4a85", "#06284d"],
};
const BUCKET_ALPHA = [0.7, 0.9, 1, 1];

type Mode = "walk" | "approach" | "settle" | "sit" | "rise";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  g: string;
  s: number;
}

/** Cheap integer hash -> [0, 1). */
function h2(x: number, y: number, z: number): number {
  let n = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function LionCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef<Theme>(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !host || !ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sample = document.createElement("canvas");
    const sctx = sample.getContext("2d", { willReadFrequently: true });
    if (!sctx) return;

    let walkImgs: HTMLImageElement[] = [];
    let sitImgs: HTMLImageElement[] = [];
    let mapW = 520;
    let mapH = 340;
    let walkGrids: Uint8Array[] = [];
    let sitGrids: Uint8Array[] = [];

    let W = 0;
    let H = 0;
    let dpr = 1;
    let lw = 0; // lion width in px
    let restX = 0; // left edge of the lion when it rests
    let y0 = 0;
    let cw = 4;
    let ch = 7;
    let cols = 0;
    let colsExtra = 0;
    let rows = 0;
    let headX = 0;
    let headY = 0;
    let headRx = 1;
    let headRy = 1;
    let faceX = 0;
    let faceY = 0;
    let faceRx = 1;
    let faceRy = 1;
    let fontFamily = "monospace";
    let fs = 7;
    let sparks: Spark[] = [];
    let avoid: { l: number; t: number; r: number; b: number } | null = null;

    // Simulation state.
    // The lion starts lying at its resting place, looking at the visitor.
    let mode: Mode = "sit";
    let lx = 0; // left edge of the lion in px
    let walkClock = 0;
    let clock = 0;
    let modeT = 0;
    let sitMix = 1; // 0 = walking pose, 1 = seated
    let headMix = 1; // 0 = head in profile, 1 = head turned to the visitor
    let mouthMix = 0; // 0 = mouth closed, 1 = yawning
    let yawnPhase = 0; // 0 idle, 1 opening, 2 holding, 3 closing
    let yawnTimer = 3;
    let watchMix = 0; // 0 = idle head motion, 1 = head follows the mouse
    let followX = 0; // smoothed mouse direction relative to the head, -1..1
    let followY = 0;
    let pointer: { x: number; y: number } | null = null; // last mouse position (client px)

    let raf = 0;
    let visible = true;
    let alive = true;
    let lastNow = performance.now();

    const buckets: number[][] = [[], [], [], []];
    const avoidEl = host.querySelector<HTMLElement>("[data-lion-avoid]");

    const measureAvoid = () => {
      if (!avoidEl) return;
      const hr = host.getBoundingClientRect();
      const r = avoidEl.getBoundingClientRect();
      const pad = 16;
      avoid = { l: r.left - hr.left - pad, t: r.top - hr.top - pad, r: r.right - hr.left + pad, b: r.bottom - hr.top + pad };
    };

    const layout = () => {
      const prevW = W;
      const r = host.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      const aspect = mapH / mapW;
      const small = W < 700;
      lw = Math.min(W * (small ? 0.98 : 0.72), (H * 0.7) / aspect);
      const lh = lw * aspect;
      restX = small ? (W - lw) / 2 : W - lw - W * 0.015;
      y0 = H - lh - 6 + (small ? lh * 0.04 : 0);
      if (prevW > 1) lx *= W / prevW;
      if (mode === "sit" || mode === "settle") lx = restX;

      // The grid is wider than the walking lion: the lying pose is drawn larger and its tail extends to
      // the left, so the extra columns on the left hold the tail while walking poses leave them empty.
      const walkCols = Math.min(320, Math.max(120, Math.round(lw / 3.2)));
      cw = lw / walkCols;
      colsExtra = Math.round(walkCols * (SIT_ZOOM - 1));
      cols = walkCols + colsExtra;
      fs = cw / 0.6;
      ch = fs * 1.12;
      rows = Math.max(1, Math.round(lh / ch));
      // Head and tail positions of the lying pose, in grid cells (used for the idle animation).
      headX = cols * (HEAD.x / mapW);
      headY = rows * (1 - (SIT_ZOOM * (mapH - HEAD.y)) / mapH);
      headRx = cols * (HEAD.rx / mapW);
      headRy = rows * ((SIT_ZOOM * HEAD.ry) / mapH);
      faceX = cols * (FACE.x / mapW);
      faceY = rows * (1 - (SIT_ZOOM * (mapH - FACE.y)) / mapH);
      faceRx = cols * (FACE.rx / mapW);
      faceRy = rows * ((SIT_ZOOM * FACE.ry) / mapH);

      const mono = getComputedStyle(document.body).getPropertyValue("--font-jetbrains").trim();
      fontFamily = mono ? `${mono}, ui-monospace, Consolas, monospace` : "ui-monospace, Consolas, monospace";

      // Resample each pose to the character grid (one brightness byte per cell).
      sample.width = cols;
      sample.height = rows;
      const readGrid = () => {
        const d = sctx.getImageData(0, 0, cols, rows).data;
        const g = new Uint8Array(cols * rows);
        for (let i = 0; i < g.length; i++) g[i] = d[i * 4];
        return g;
      };
      // Walking poses sit at the right of the grid.
      walkGrids = walkImgs.map((img) => {
        sctx.imageSmoothingQuality = "high";
        sctx.clearRect(0, 0, cols, rows);
        sctx.drawImage(img, colsExtra, 0, cols - colsExtra, rows);
        return readGrid();
      });
      // The lying pose fills the whole grid, enlarged about the bottom (nose and paws stay in place).
      sitGrids = sitImgs.map((img) => {
        sctx.imageSmoothingQuality = "high";
        sctx.clearRect(0, 0, cols, rows);
        sctx.drawImage(img, 0, rows * (1 - SIT_ZOOM), cols, rows * SIT_ZOOM);
        return readGrid();
      });
      measureAvoid();
    };

    /** Advance the behaviour state machine by dt seconds. */
    const update = (dt: number, target: LionMode) => {
      const resting = target !== "walk";
      const speed = (W + lw) / CROSS_SECONDS;
      const wrap = () => {
        if (lx > W + 40) lx = -lw - 40;
      };

      switch (mode) {
        case "walk": {
          lx += speed * dt;
          walkClock += dt;
          wrap();
          if (resting) mode = "approach";
          break;
        }
        case "approach": {
          if (!resting) {
            mode = "walk";
            break;
          }
          // Same calm pace as the normal walk: going to rest must not make the lion hurry.
          if (lx > restX + 1) {
            // Already past the resting place: keep walking, loop round and arrive from the left.
            lx += speed * dt;
            walkClock += dt;
            wrap();
          } else {
            const remaining = restX - lx;
            const factor = 0.22 + 0.78 * smooth(0, lw * 0.7, remaining);
            const step = speed * factor * dt;
            walkClock += dt * factor;
            if (step >= remaining) {
              lx = restX;
              mode = "settle";
              modeT = 0;
            } else {
              lx += step;
            }
          }
          break;
        }
        case "settle": {
          if (!resting) {
            mode = "rise";
            break;
          }
          modeT += dt;
          sitMix = clamp01(sitMix + dt / 1.7);
          if (sitMix >= 1) {
            mode = "sit";
            modeT = 0;
          }
          break;
        }
        case "sit": {
          if (!resting) {
            mode = "rise";
            break;
          }
          modeT += dt;
          if (modeT > 0.6) headMix = clamp01(headMix + dt / 1.5);
          // Once it faces the visitor it yawns from time to time.
          if (headMix >= 1) {
            if (yawnPhase === 0) {
              yawnTimer -= dt;
              if (yawnTimer <= 0) yawnPhase = 1;
            } else if (yawnPhase === 1) {
              mouthMix = clamp01(mouthMix + dt / 0.8);
              if (mouthMix >= 1) {
                yawnPhase = 2;
                yawnTimer = 1.5;
              }
            } else if (yawnPhase === 2) {
              yawnTimer -= dt;
              if (yawnTimer <= 0) yawnPhase = 3;
            } else {
              mouthMix = clamp01(mouthMix - dt / 1.0);
              if (mouthMix <= 0) {
                yawnPhase = 0;
                yawnTimer = 4.5 + Math.random() * 5;
              }
            }
          } else {
            yawnTimer = 3;
          }
          break;
        }
        case "rise": {
          if (resting) {
            mode = "settle";
            break;
          }
          yawnPhase = 0;
          mouthMix = clamp01(mouthMix - dt / 0.4);
          if (headMix > 0) headMix = clamp01(headMix - dt / 0.6);
          else sitMix = clamp01(sitMix - dt / 1.3);
          if (headMix <= 0 && sitMix <= 0) mode = "walk";
          break;
        }
      }
    };

    const frame = (now: number, still = false) => {
      if (!walkGrids.length || !sitGrids.length) return;
      const dt = still ? 0 : Math.min(Math.max(0, (now - lastNow) / 1000), 0.05);
      lastNow = now;
      if (still) {
        lx = restX;
        sitMix = 1;
        headMix = 1;
      } else {
        clock += dt;
        update(dt, getLionMode());
      }

      const n = walkGrids.length;
      const seq = walkClock / STEP_SECONDS;
      const i0 = Math.floor(seq) % n;
      const i1 = (i0 + 1) % n;
      const walkBlend = smooth(0.15, 0.7, seq - Math.floor(seq));
      const A = walkGrids[i0];
      const B = walkGrids[i1];
      const S0 = sitGrids[0];
      const S1 = sitGrids[Math.min(1, sitGrids.length - 1)];
      const S2 = sitGrids[Math.min(2, sitGrids.length - 1)]; // mouth open
      const S3 = sitGrids[3] ?? S1; // head turned to the left
      const sitS = smooth(0, 1, sitMix);
      const headS = smooth(0, 1, headMix);
      const mouthS = smooth(0, 1, mouthMix);
      const bob = still ? 0 : Math.sin(seq * Math.PI * 2) * 1.6 * (1 - sitS);
      const swayK = 1 - 0.55 * sitS;
      const gx0 = lx - colsExtra * cw; // left edge of the grid (the tail side of the lying pose)

      // Idle motion of the lying lion: the head turns, tilts and bobs slowly (and lifts when yawning),
      // and the tail tip swishes on the left.
      const idle = still ? 0 : smooth(0.7, 1, sitS);

      // The head follows the mouse while the lion rests and faces the visitor. The direction is measured
      // from the head to the pointer and eased, so the head glides instead of snapping.
      const wantsWatch = !still && mode === "sit" && headMix >= 1 && pointer !== null;
      watchMix = clamp01(watchMix + (wantsWatch ? dt / 0.6 : -dt / 0.5));
      let tx = 0;
      let ty = 0;
      if (wantsWatch && pointer) {
        const hr = host.getBoundingClientRect();
        const hx = hr.left + gx0 + (headX + 0.5) * cw;
        const hy = hr.top + y0 + (headY + 0.5) * ch;
        tx = Math.max(-1, Math.min(1, (pointer.x - hx) / (W * FOLLOW_RANGE)));
        ty = Math.max(-1, Math.min(1, (pointer.y - hy) / (H * 0.5)));
      }
      const ease = Math.min(1, dt * 6);
      followX += (tx - followX) * ease;
      followY += (ty - followY) * ease;
      const wm = smooth(0, 1, watchMix);
      const calm = 1 - 0.85 * wm; // idle wandering fades out while following the mouse

      // Whole head (mane and neck included): only the slow idle wandering and the yawn lift.
      const hTurn = idle * calm * (1.5 * Math.sin(clock * 0.7) + 0.6 * Math.sin(clock * 1.9));
      const hBob = idle * (calm * 0.9 * Math.sin(clock * 1.1 + 1) - 1.8 * mouthS);
      const hTilt = idle * calm * 1.1 * Math.sin(clock * 0.45 + 2);
      // Following the mouse: the whole head (mane and face) turns a little, and the face a bit more.
      // The shift fades out towards the bottom of the head, so the neck and chest stay still.
      const turnX = idle * wm * followX * TURN_X;
      const turnY = idle * wm * followY * TURN_Y;
      const gazeX = idle * wm * followX * GAZE_X;
      const gazeY = idle * wm * followY * GAZE_Y;
      // Larger turns swap the head for a profile pose, cell by cell: left profile when the mouse is on
      // the left, right profile when it is on the right, frontal in between.
      const yawL = idle * wm * smooth(0.12, 0.85, -followX);
      const yawR = idle * wm * smooth(0.12, 0.85, followX);
      const mouthEff = mouthS * clamp01(1 - 2.5 * (yawL + yawR));

      for (const b of buckets) b.length = 0;
      const tick = Math.floor(clock * 3);
      for (let y = 0; y < rows; y++) {
        const py = y0 + (y + 0.5) * ch + bob;
        for (let x = 0; x < cols; x++) {
          const px = gx0 + (x + 0.5) * cw;
          if (px < -cw || px > W + cw) continue;

          // Hair, tail and dust sway: strongest toward the tail end (left side).
          const sway = still
            ? 0
            : (Math.sin(clock * 2.2 + y * 0.24 + x * 0.02) * 1.5 * (1 - x / cols) ** 1.3 +
                Math.sin(clock * 3.4 + y * 0.45) * 0.6 * smooth(0.55, 0.8, x / cols) * (1 - y / rows)) *
              swayK;
          const sx = Math.min(cols - 1, Math.max(0, x + Math.round(sway)));
          const idx = y * cols + sx;

          let g: number;
          if (sitS <= 0) {
            g = h2(x, y, 11) < walkBlend ? B[idx] : A[idx];
          } else {
            const gw = h2(x, y, 11) < walkBlend ? B[idx] : A[idx];
            let sidx = idx;
            if (idle > 0) {
              let dx = 0;
              let dy = 0;
              const ex = (x - headX) / headRx;
              const ey = (y - headY) / headRy;
              const e = Math.hypot(ex, ey);
              if (e < 1.3) {
                const w = 1 - smooth(0.8, 1.3, e);
                dx = w * (hTurn + hTilt * ey);
                dy = w * hBob;
                if (turnX !== 0 || turnY !== 0) {
                  const wh = (1 - smooth(0.85, 1.25, e)) * (1 - smooth(0.05, 0.95, ey));
                  dx += wh * turnX;
                  dy += wh * turnY;
                }
                if (gazeX !== 0 || gazeY !== 0) {
                  const wf = 1 - smooth(0.55, 1.05, Math.hypot((x - faceX) / faceRx, (y - faceY) / faceRy));
                  dx += wf * gazeX;
                  dy += wf * gazeY;
                }
              } else if (x < cols * 0.28 && y > rows * 0.6) {
                // tail: the tip swishes more than the base
                const w = 1 - smooth(0.02, 0.27, x / cols);
                dx = w * idle * 0.9 * Math.sin(clock * 1.7 + 1);
                dy = w * idle * 1.6 * Math.sin(clock * 2.6 + x * 0.1);
              }
              if (dx !== 0 || dy !== 0) {
                const qx = Math.min(cols - 1, Math.max(0, Math.round(sx - dx)));
                const qy = Math.min(rows - 1, Math.max(0, Math.round(y - dy)));
                sidx = qy * cols + qx;
              }
            }
            let gs = h2(x, y, 23) < headS ? S1[sidx] : S0[sidx];
            if (yawL > 0 || yawR > 0) {
              const r = h2(x, y, 53);
              if (r < yawL) gs = S3[sidx];
              else if (r < yawL + yawR) gs = S0[sidx];
            }
            if (mouthEff > 0 && h2(x, y, 41) < mouthEff) gs = S2[sidx];
            g = h2(x, y, 37) < sitS ? gs : gw;
          }
          const v = g / 255;
          if (v < V_MIN) continue;

          // Keep the text legible: the lion fades behind the hero copy.
          if (avoid && px > avoid.l && px < avoid.r && py > avoid.t && py < avoid.b && h2(x, y, 5) < 0.74) continue;

          const k = (v - V_MIN) / (1 - V_MIN);
          const lvl = Math.min(RAMP.length - 1, Math.floor(k ** 0.95 * RAMP.length));
          const set = RAMP[lvl];
          const c = set.charCodeAt(Math.floor(h2(x, y, tick + ((x * 7 + y * 13) % 5)) * set.length));
          const bucket = v < 0.3 ? 0 : v < 0.5 ? 1 : v < 0.78 ? 2 : 3;
          buckets[bucket].push(px, py, c);
        }
      }

      // Sparks: lift off bright cells and stream away behind the lion.
      if (!still) {
        const src = sitS > 0.5 ? S0 : A;
        const rate = sitS > 0.9 ? 0.25 : 3;
        for (let i = 0; i < 3 && sparks.length < 280; i++) {
          if (Math.random() > rate / 3) continue;
          const x = Math.floor(Math.random() * cols * 0.78);
          const y = Math.floor(Math.random() * rows);
          if (src[y * cols + x] < 150) continue;
          const max = 1.1 + Math.random() * 1.2;
          sparks.push({
            x: gx0 + (x + 0.5) * cw,
            y: y0 + (y + 0.5) * ch,
            vx: -(45 + Math.random() * 120),
            vy: (Math.random() - 0.5) * 34 - 6,
            life: max,
            max,
            g: SPARK_GLYPHS[Math.floor(Math.random() * SPARK_GLYPHS.length)],
            s: 0.9 + Math.random() * 1.2,
          });
        }
      }

      const colors = PALETTE[themeRef.current];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `600 ${fs}px ${fontFamily}`;
      for (let b = 0; b < 4; b++) {
        ctx.fillStyle = colors[b];
        ctx.globalAlpha = BUCKET_ALPHA[b];
        const list = buckets[b];
        for (let i = 0; i < list.length; i += 3) {
          ctx.fillText(String.fromCharCode(list[i + 2]), list[i], list[i + 1]);
        }
      }

      ctx.fillStyle = colors[3];
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= dt;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        ctx.globalAlpha = Math.max(0, s.life / s.max) * 0.85;
        ctx.font = `600 ${fs * s.s}px ${fontFamily}`;
        ctx.fillText(s.g, s.x, s.y);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      if (!alive) return;
      if (visible && !document.hidden) frame(now);
      else lastNow = now; // do not accumulate time while off-screen
      raf = requestAnimationFrame(loop);
    };

    const relayout = () => {
      layout();
      sparks = [];
      if (reduced) frame(performance.now(), true);
    };

    const ro = new ResizeObserver(() => {
      if (walkImgs.length) relayout();
    });
    ro.observe(host);
    if (avoidEl) ro.observe(avoidEl);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(host);

    // Mouse position for the "watch" mode (the canvas has pointer-events: none, so listen on the window).
    const onPointer = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      pointer = null;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    // Load the pose maps, then start.
    (async () => {
      try {
        const res = await fetch("/lion/manifest.json");
        const m: { frames: number; sit?: number; width: number; height: number } = await res.json();
        mapW = m.width;
        mapH = m.height;
        const [walk, sit] = await Promise.all([
          Promise.all(Array.from({ length: m.frames }, (_, i) => load(`/lion/frame-${i}.png`))),
          Promise.all(Array.from({ length: m.sit ?? 0 }, (_, i) => load(`/lion/sit-${i}.png`))),
        ]);
        if (!alive) return;
        walkImgs = walk;
        sitImgs = sit.length ? sit : [walk[0]];
        layout();
        // The lion starts lying at its resting place.
        lx = restX;
        lastNow = performance.now();
        if (reduced) frame(lastNow, true);
        else raf = requestAnimationFrame(loop);
      } catch (err) {
        // The hero still works without the lion.
        console.warn("Lion animation unavailable:", err);
      }
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
