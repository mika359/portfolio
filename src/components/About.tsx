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
            <div className="space-y-4 p-5 leading-relaxed text-fg sm:p-6">
              <p>{t("about.p1")}</p>
              <p className="text-muted">{t("about.p2")}</p>
              <p className="font-mono text-sm text-accent">
                <span className="text-muted">{"// "}</span>
                {t("about.p3")}
              </p>
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
