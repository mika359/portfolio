"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { projects } from "@/data/projects";

type Filter = "all" | "security" | "dev";

export default function ProjectsView() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("projects.filterAll") },
    { id: "security", label: t("projects.filterSecurity") },
    { id: "dev", label: t("projects.filterDev") },
  ];
  const visible = projects.filter((p) => filter === "all" || p.category === filter);

  return (
    <section className="section">
      <div className="container-x">
        <p className="eyebrow">{t("projects.eyebrow")}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{t("projects.title")}</h1>
        <p className="mt-4 max-w-2xl text-muted">{t("projects.subtitle")}</p>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label={t("projects.title")}>
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`min-h-11 rounded-lg border px-4 font-mono text-sm transition ${
                filter === f.id
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-line text-fg hover:border-accent hover:text-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="mt-10 text-muted">{t("projects.empty")}</p>
        ) : (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <li key={p.id} className="card flex flex-col p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-accent">
                  {p.category === "security" ? t("projects.filterSecurity") : t("projects.filterDev")}
                </p>
                <h2 className="mt-2 text-xl font-semibold">{t(`projects.items.${p.id}.title`)}</h2>
                <p className="mt-3 flex-1 text-muted">{t(`projects.items.${p.id}.desc`)}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {p.tags.map((tag) => (
                    <li key={tag} className="rounded-md border border-line bg-accent/5 px-2 py-0.5 font-mono text-xs">
                      {tag}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex gap-4 font-mono text-sm">
                  <a href={p.code} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {t("projects.code")} ↗
                  </a>
                  {p.demo && (
                    <a href={p.demo} className="text-accent hover:underline">
                      {t("projects.demo")} ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
