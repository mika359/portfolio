"use client";

import { useI18n } from "@/i18n/I18nProvider";

export default function About() {
  const { t, list } = useI18n();
  const highlights = list<{ value: string; label: string }>("about.highlights");

  return (
    <section id="about" className="section">
      <div className="container-x grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        <div>
          <p className="eyebrow">{t("about.eyebrow")}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t("about.title")}</h2>

          <div className="card mt-6 overflow-hidden !transform-none">
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-accent/80" />
              <span className="h-3 w-3 rounded-full bg-accent/50" />
              <span className="h-3 w-3 rounded-full bg-accent/25" />
              <span className="ml-3 font-mono text-xs text-muted">~/about.md</span>
            </div>
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:gap-7 sm:p-6">
              <div className="relative order-first mx-auto aspect-[4/5] w-36 shrink-0 overflow-hidden rounded-xl border border-line sm:order-last sm:mx-0 sm:w-44 lg:w-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/me.jpg" alt="Mykhaylo" width={800} height={1000} className="h-full w-full object-cover object-top" />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: "linear-gradient(to top, color-mix(in srgb, var(--accent-strong) 28%, transparent), transparent 55%)",
                    mixBlendMode: "soft-light",
                  }}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-4 leading-relaxed text-fg">
                <p>{t("about.p1")}</p>
                <p className="text-muted">{t("about.p2")}</p>
                <p className="font-mono text-sm text-accent">
                  <span className="text-muted">{"// "}</span>
                  {t("about.p3")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ul className="grid content-start gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {highlights.map((h) => (
            <li key={h.label} className="card flex items-center gap-4 p-5">
              <span className="min-w-14 font-mono text-3xl font-bold text-accent glow-text">{h.value}</span>
              <span className="text-sm text-muted">{h.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
