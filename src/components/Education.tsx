"use client";

import { useI18n } from "@/i18n/I18nProvider";

interface Item {
  period: string;
  title: string;
  place: string;
  text: string;
}

export default function Education() {
  const { t, list } = useI18n();
  const items = list<Item>("education.items");

  return (
    <section id="education" className="section">
      <div className="container-x">
        <p className="eyebrow">{t("education.eyebrow")}</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t("education.title")}</h2>

        <ol className="relative mt-10 space-y-6 border-l border-line pl-6 sm:pl-8">
          {items.map((it, i) => (
            <li key={i} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[1.95rem] top-6 h-3 w-3 rounded-full bg-accent shadow-[0_0_14px_var(--glow)] sm:-left-[2.45rem]"
              />
              <article className="card p-5 sm:p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-accent">{it.period}</p>
                <h3 className="mt-1 text-lg font-semibold">{it.title}</h3>
                <p className="font-mono text-sm text-muted">{it.place}</p>
                <p className="mt-3 text-muted">{it.text}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
