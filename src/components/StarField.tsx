"use client";

import { useEffect, useRef } from "react";
import { useTheme, type Theme } from "@/lib/theme";

interface Star {
  x: number;
  y: number;
  r: number;
  tw: number; // twinkle speed
  ph: number; // twinkle phase
}
interface Streak {
  x: number;
  y: number;
  len: number;
  speed: number;
  a: number;
}

const GLYPHS = ["0", "1"];

/** Fixed full-page background: twinkling stars, drifting streaks and a few falling 0/1. */
export default function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef<Theme>(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let streaks: Streak[] = [];
    let bits: { x: number; y: number; v: number; g: string }[] = [];
    let raf = 0;
    let last = performance.now();

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const n = Math.min(260, Math.round((w * h) / 7000));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + 0.25,
        tw: Math.random() * 1.6 + 0.4,
        ph: Math.random() * Math.PI * 2,
      }));
      streaks = Array.from({ length: Math.round(n / 14) }, () => newStreak(true));
      bits = Array.from({ length: Math.round(n / 12) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        v: 8 + Math.random() * 18,
        g: GLYPHS[Math.floor(Math.random() * 2)],
      }));
    };

    const newStreak = (anywhere: boolean): Streak => ({
      x: anywhere ? Math.random() * w : w + 40,
      y: anywhere ? Math.random() * h : Math.random() * h * 0.8,
      len: 6 + Math.random() * 16,
      speed: 18 + Math.random() * 40,
      a: 0.15 + Math.random() * 0.35,
    });

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const light = themeRef.current === "light";
      const rgb = light ? "11,58,107" : "190,235,255";
      const starBoost = light ? 0.55 : 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        const a = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now / 1000 * s.tw + s.ph))) * starBoost;
        ctx.fillStyle = `rgba(${rgb},${a * 0.9})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      for (const s of streaks) {
        if (!reduced) {
          s.x -= s.speed * dt;
          s.y += s.speed * dt * 0.25;
        }
        if (s.x < -40 || s.y > h + 40) Object.assign(s, newStreak(false));
        ctx.strokeStyle = `rgba(${rgb},${s.a * starBoost})`;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.len, s.y - s.len * 0.25);
        ctx.stroke();
      }

      ctx.font = "12px ui-monospace, Consolas, monospace";
      ctx.fillStyle = light ? "rgba(11,95,168,0.22)" : "rgba(95,212,255,0.2)";
      for (const b of bits) {
        if (!reduced) b.y += b.v * dt;
        if (b.y > h + 12) {
          b.y = -12;
          b.x = Math.random() * w;
          b.g = GLYPHS[Math.floor(Math.random() * 2)];
        }
        ctx.fillText(b.g, b.x, b.y);
      }

      if (!reduced && !document.hidden) raf = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      if (!document.hidden && !reduced) {
        cancelAnimationFrame(raf);
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    };

    build();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", build);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
}
