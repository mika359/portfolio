"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import LionCanvas from "./LionCanvas";
import BrandName from "./BrandName";
import LionControls from "./LionControls";

function subscribeReduced(cb: () => void) {
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Types each phrase, pauses, deletes it, then moves on to the next one. */
function useTypewriter(phrases: string[]) {
  const [state, setState] = useState({ index: 0, chars: 0, deleting: false });
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const joined = phrases.join("|");

  useEffect(() => {
    if (!phrases.length || reduced) return;
    const phrase = phrases[state.index % phrases.length];
    let delay = state.deleting ? 28 : 65;
    if (!state.deleting && state.chars === phrase.length) delay = 1600;
    if (state.deleting && state.chars === 0) delay = 350;

    const id = setTimeout(() => {
      setState((s) => {
        const p = phrases[s.index % phrases.length];
        if (!s.deleting && s.chars < p.length) return { ...s, chars: s.chars + 1 };
        if (!s.deleting) return { ...s, deleting: true };
        if (s.chars > 0) return { ...s, chars: s.chars - 1 };
        return { index: (s.index + 1) % phrases.length, chars: 0, deleting: false };
      });
    }, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, joined, reduced]);

  if (!phrases.length) return "";
  if (reduced) return phrases[0];
  return (phrases[state.index % phrases.length] ?? "").slice(0, state.chars);
}

export default function Hero() {
  const { t, list } = useI18n();
  const role = useTypewriter(list<string>("hero.roles"));

  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] overflow-hidden" aria-labelledby="hero-title">
      {/* soft glow behind the lion */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 70% 75%, color-mix(in srgb, var(--accent-strong) 22%, transparent), transparent 70%)",
          maskImage: "linear-gradient(to bottom, #000 60%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 60%, transparent 100%)",
        }}
      />
      <LionCanvas />

      <div className="container-x relative z-10 px-5 pt-10 pb-[52vw] min-[700px]:pb-0 sm:pt-16 lg:pt-20">
        <div data-lion-avoid className="flex w-fit max-w-full flex-col">
        <p className="fade-up font-mono text-sm text-muted" style={{ animationDelay: "0.05s" }}>
          <span className="text-accent">$</span> {t("hero.prompt")}
        </p>

        <h1
          id="hero-title"
          className="fade-up mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
          style={{ animationDelay: "0.15s" }}
        >
          <span className="block text-xl font-medium text-muted sm:text-2xl">{t("hero.greeting")}</span>
          <BrandName className="glow-text [&>span]:text-accent [&>span]:[text-shadow:0_0_28px_var(--glow)]" />
        </h1>

        <p
          className="fade-up mt-4 min-h-8 font-mono text-lg text-fg sm:text-2xl"
          style={{ animationDelay: "0.3s" }}
          aria-live="off"
        >
          <span className="text-accent">&gt;</span> <span className="cursor">{role}</span>
        </p>

        <p className="fade-up mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg" style={{ animationDelay: "0.45s" }}>
          {t("hero.lead")}
        </p>

        <div className="fade-up mt-7 flex flex-wrap gap-3" style={{ animationDelay: "0.6s" }}>
          <Link href="/projects" className="btn btn-primary">
            {t("hero.ctaProjects")}
          </Link>
          <Link href="/#contact" className="btn btn-ghost">
            {t("hero.ctaContact")}
          </Link>
        </div>
        <div className="fade-up mt-3" style={{ animationDelay: "0.7s" }}>
          <LionControls />
        </div>
        </div>
      </div>
    </section>
  );
}
