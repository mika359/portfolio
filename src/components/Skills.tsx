"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { skills } from "@/data/skills";

export default function Skills() {
  const { t } = useI18n();

  return (
    <section id="skills" className="section">
      <div className="container-x">
        <p className="eyebrow">{t("skills.eyebrow")}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t("skills.title")}</h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {skills.map((group) => (
            <article key={group.id} className="card p-5">
              <h3 className="font-mono text-sm font-semibold text-accent">
                <span className="text-muted">./</span>
                {t(`skills.${group.id}`)}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-line bg-accent/5 px-2.5 py-1 font-mono text-xs text-fg"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
